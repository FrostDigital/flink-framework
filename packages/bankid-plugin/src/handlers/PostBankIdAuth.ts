import { Handler, RouteProps, badRequest, internalServerError, log } from "@flink-app/flink";
import { QrGenerator } from "bankid";
import { Ctx } from "../BankIdPluginContext";
import AuthInitiateReq from "../schemas/AuthInitiateReq";
import AuthInitiateRes from "../schemas/AuthInitiateRes";
import BankIdSession from "../schemas/BankIdSession";

export const Route: RouteProps = {
    path: "/bankid/auth",
};

const bankIdQrTimeoutSec = 30;

const PostBankidAuth: Handler<Ctx, AuthInitiateReq, AuthInitiateRes> = async ({ ctx, req }) => {
    const { bankIdClient, options } = ctx.plugins.bankId;

    let clientIp = await options.onGetEndUserIp(req);

    if (!clientIp) {
        if (options.allowNoIp) {
            log.warn("No IP address provided, using default 127.0.0.1 - this should be used with caution!");
            clientIp = "127.0.0.1";
        } else {
            log.error("No IP address provided and not allowed to use default");
            return internalServerError("Failed to obtain endUserIp");
        }
    }

    let authResponse: Awaited<ReturnType<typeof bankIdClient.authenticate>>; // Hack because AuthRequestV6 is not exported in bankid package

    try {
        // Initiate BankID authentication
        authResponse = await bankIdClient.authenticate({
            endUserIp: clientIp,
        });
    } catch (error: any) {
        // Handle specific BankID errors
        if (error.message?.includes("Already in progress")) {
            return badRequest("Authentication already in progress for this user");
        }

        if (error.message?.includes("Invalid parameters")) {
            return badRequest("Invalid request parameters");
        }

        return internalServerError("Failed to initiate BankID authentication");
    }

    const session: Omit<BankIdSession, "_id"> = {
        orderRef: authResponse.orderRef,
        type: "auth",
        status: "pending",
        createdAt: new Date(),
        ip: clientIp,
        autoStartToken: authResponse.autoStartToken,
        qr: {
            qrStartToken: authResponse.qrStartToken,
            qrStartSecret: authResponse.qrStartSecret,
        },
    };

    await ctx.repos.bankIdSessionRepo.createSession(session);

    const qrGenerator = authResponse.qr;

    if (!qrGenerator) {
        log.error("No QR code generator returned from BankID");
        return internalServerError("Failed to obtain QR code generator");
    }

    // Bake first QR code directly to have it in first response
    // After this the QR code will be updated periodically in checkAndGenerateQr function
    const firstQrCode = qrGenerator.nextQr(authResponse.orderRef, { timeout: bankIdQrTimeoutSec });

    // Continue generating QR codes and updating the session
    // This is used even if QR code is not used, will still collect
    // order ref status even if auto start token was used by client
    checkAndGenerateQr(ctx, authResponse.orderRef, qrGenerator);

    return {
        data: {
            orderRef: authResponse.orderRef,
            autoStartToken: authResponse.autoStartToken,
            qr: firstQrCode,
        },
    };
};

export default PostBankidAuth;

/**
 * This is the loop that continuously checks for new QR codes and updates the session status.
 * When user polls/collects status using other endpoint this is still where the status is updated.
 *
 * Note that this loops is still used even if auto start token is used instead of QR code.
 *
 * @param ctx
 * @param orderRef
 * @param qrGenerator
 * @returns
 */
async function checkAndGenerateQr(ctx: Ctx, orderRef: string, qrGenerator: QrGenerator) {
    for await (const newQrCode of qrGenerator.nextQr(orderRef, { timeout: bankIdQrTimeoutSec })) {
        // First get from db to see if session still exists and is not cancelled
        const session = await ctx.repos.bankIdSessionRepo.getSession(orderRef);

        if (!session) {
            log.warn("Session not found:", orderRef);
            return;
        }

        if (session.status === "cancelled") {
            log.warn("Session already cancelled:", orderRef);
            return;
        }

        const resp = await ctx.plugins.bankId.bankIdClient.collect({ orderRef });

        await ctx.repos.bankIdSessionRepo.updateSession(orderRef, { "qr.qr": newQrCode, hintCode: resp.hintCode });

        if (resp.status === "complete") {
            const completionData = resp.completionData;

            if (!completionData) {
                log.error("No completion data returned from BankID");
                return internalServerError("Failed to obtain completion data");
            }

            await ctx.repos.bankIdSessionRepo.completeSession(orderRef, {
                user: completionData.user,
                device: completionData.device,
                hintCode: resp.hintCode,
            });
            break;
        } else if (resp.status === "failed") {
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "BANKID_AUTH_FAILED", resp.hintCode);
            break;
        }

        await new Promise((r) => setTimeout(r, 2000));
    }
}
