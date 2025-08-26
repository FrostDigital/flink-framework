import { log } from "@flink-app/flink";
import BankIdSession from "../schemas/BankIdSession";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import { checkAndGenerateQr } from "../bankid-utils";

export interface SignOptions {
    userVisibleData: string;
    userNonVisibleData?: string;
    endUserIp?: string;
    payload?: Record<string, any>;
}

export interface SignResponse {
    orderRef: string;
    autoStartToken: string;
    qr: string;
}

export async function sign(ctx: BankIdInternalCtx, options: SignOptions): Promise<SignResponse> {
    const { bankIdClient, options: pluginOptions } = ctx.plugins.bankId;
    const { userVisibleData, userNonVisibleData } = options;

    if (!pluginOptions.onSignSuccess) {
        log.error("No onSignSuccess callback defined");
        throw new Error("Sign success callback not defined");
    }

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
        payload: options.payload,
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

    // Get the first QR code and start the background QR generation loop
    const firstQrCode = await checkAndGenerateQr(ctx, signResponse.orderRef, qrGenerator);

    return {
        orderRef: signResponse.orderRef,
        autoStartToken: signResponse.autoStartToken,
        qr: firstQrCode,
    };
}
