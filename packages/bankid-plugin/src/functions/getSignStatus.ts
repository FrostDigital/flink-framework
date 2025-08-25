import { log } from "@flink-app/flink";
import { BankIdInternalCtx } from "../BankIdInternalContext";

export interface SignStatusOptions {
    orderRef: string;
}

export interface SignStatusResponse {
    status: "pending" | "complete" | "failed" | "cancelled";
    orderRef: string;
    user?: any;
    signature?: any;
    errorCode?: string;
    hintCode?: string;
    qr?: string;
}

export async function getSignStatus(ctx: BankIdInternalCtx, options: SignStatusOptions): Promise<SignStatusResponse> {
    const { orderRef } = options;
    const { options: pluginOptions } = ctx.plugins.bankId;

    if (!pluginOptions.onSignSuccess) {
        log.error("No onSignSuccess callback defined");
        throw new Error("Sign success callback not defined");
    }

    // Find session in database
    const session = await ctx.repos.bankIdSessionRepo.getSession(orderRef, "sign");

    if (!session) {
        throw new Error("BankId session not found");
    }

    // Session is completed, invoke callback
    if (session.status === "complete") {
        // Validate that user data is present
        if (!session.user) {
            log.error(`Sign session ${orderRef} marked complete but user data is missing`);
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "USER_DATA_MISSING");
            throw new Error("User data is missing");
        }

        // Validate that signature data is present
        if (!session.signature) {
            log.error(`Sign session ${orderRef} marked complete but signature data is missing`);
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "SIGNATURE_DATA_MISSING");
            throw new Error("Signature data is missing");
        }

        // Invoke host app callback
        await pluginOptions.onSignSuccess(session.user, session.signature);

        return {
            status: "complete",
            orderRef,
            user: session.user,
            signature: session.signature,
        };
    }

    // If session failed or cancelled, return status
    if (session.status === "failed" || session.status === "cancelled") {
        return {
            status: session.status,
            orderRef,
            errorCode: session.errorCode || undefined,
        };
    }

    return {
        status: "pending",
        orderRef,
        hintCode: session.hintCode || undefined,
        qr: session.qr?.qr,
    };
}
