import { log } from "@flink-app/flink";
import { QrGenerator } from "bankid";
import { Ctx } from "../BankIdPluginContext";
import BankIdSession from "../schemas/BankIdSession";

const bankIdQrTimeoutSec = 30;

export interface SignOptions {
    userVisibleData: string;
    userNonVisibleData?: string;
    endUserIp?: string;
}

export interface SignResponse {
    orderRef: string;
    autoStartToken: string;
    qr: string;
}

export async function sign(ctx: Ctx, options: SignOptions): Promise<SignResponse> {
    const { bankIdClient, options: pluginOptions } = ctx.plugins.bankId;
    const { userVisibleData, userNonVisibleData } = options;

    if (!userVisibleData) {
        throw new Error("userVisibleData is required for signing");
    }

    let clientIp = options.endUserIp;

    if (!clientIp) {
        if (pluginOptions.allowNoIp) {
            log.warn("No IP address provided, using default 127.0.0.1 - this should be used with caution!");
            clientIp = "127.0.0.1";
        } else {
            log.error("No IP address provided and not allowed to use default");
            throw new Error("Failed to obtain endUserIp");
        }
    }

    let signResponse: Awaited<ReturnType<typeof bankIdClient.sign>>;

    try {
        // Initiate BankID signing
        signResponse = await bankIdClient.sign({
            endUserIp: clientIp,
            userVisibleData,
            userNonVisibleData,
        });
    } catch (error: any) {
        // Handle specific BankID errors
        if (error.message?.includes("Already in progress")) {
            throw new Error("Signing already in progress for this user");
        }

        if (error.message?.includes("Invalid parameters")) {
            throw new Error("Invalid request parameters");
        }

        throw new Error("Failed to initiate BankID signing");
    }

    const session: Omit<BankIdSession, "_id"> = {
        orderRef: signResponse.orderRef,
        type: "sign",
        status: "pending",
        createdAt: new Date(),
        ip: clientIp,
        autoStartToken: signResponse.autoStartToken,
        qr: {
            qrStartToken: signResponse.qrStartToken,
            qrStartSecret: signResponse.qrStartSecret,
        },
    };

    await ctx.repos.bankIdSessionRepo.createSession(session);

    const qrGenerator = signResponse.qr;

    if (!qrGenerator) {
        log.error("No QR code generator returned from BankID");
        throw new Error("Failed to obtain QR code generator");
    }

    // Bake first QR code directly to have it in first response
    const qrIterator = qrGenerator.nextQr(signResponse.orderRef, { timeout: bankIdQrTimeoutSec });
    const firstQrResult = await qrIterator.next();
    const firstQrCode = firstQrResult.value || "";

    // Continue generating QR codes and updating the session
    checkAndGenerateQr(ctx, signResponse.orderRef, qrGenerator);

    return {
        orderRef: signResponse.orderRef,
        autoStartToken: signResponse.autoStartToken,
        qr: firstQrCode,
    };
}

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
                throw new Error("Failed to obtain completion data");
            }

            await ctx.repos.bankIdSessionRepo.completeSession(orderRef, {
                user: completionData.user,
                device: completionData.device,
                hintCode: resp.hintCode,
            });
            break;
        } else if (resp.status === "failed") {
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "BANKID_SIGN_FAILED", resp.hintCode);
            break;
        }

        await new Promise((r) => setTimeout(r, 2000));
    }
}