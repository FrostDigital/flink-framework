import { log } from "@flink-app/flink";
import BankIdSession from "../schemas/BankIdSession";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import { checkAndGenerateQr } from "../bankid-utils";

export interface AuthOptions {
    endUserIp?: string;
}

export interface AuthResponse {
    orderRef: string;
    autoStartToken: string;
    qr: string;
}

export async function auth(ctx: BankIdInternalCtx, options: AuthOptions = {}): Promise<AuthResponse> {
    const { bankIdClient, options: pluginOptions } = ctx.plugins.bankId;

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

    let authResponse: Awaited<ReturnType<typeof bankIdClient.authenticate>>;

    try {
        // Initiate BankID authentication
        authResponse = await bankIdClient.authenticate({
            endUserIp: clientIp,
        });
    } catch (error: any) {
        // Handle specific BankID errors
        if (error.message?.includes("Already in progress")) {
            throw new Error("Authentication already in progress for this user");
        }

        if (error.message?.includes("Invalid parameters")) {
            throw new Error("Invalid request parameters");
        }

        throw new Error("Failed to initiate BankID authentication");
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
        throw new Error("Failed to obtain QR code generator");
    }

    // Get the first QR code and start the background QR generation loop
    const firstQrCode = await checkAndGenerateQr(ctx, authResponse.orderRef, qrGenerator);

    return {
        orderRef: authResponse.orderRef,
        autoStartToken: authResponse.autoStartToken,
        qr: firstQrCode,
    };
}