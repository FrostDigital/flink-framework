import { internalServerError, log, notFound } from "@flink-app/flink";
import { BankIdInternalCtx } from "../BankIdInternalContext";

export interface AuthStatusOptions {
    orderRef: string;
}

export interface AuthStatusResponse {
    status: "pending" | "complete" | "failed" | "cancelled";
    orderRef: string;
    token?: string;
    user?: any;
    errorCode?: string;
    hintCode?: string;
    qr?: string;
}

export async function getAuthStatus(ctx: BankIdInternalCtx, options: AuthStatusOptions): Promise<AuthStatusResponse> {
    const { orderRef } = options;
    const { options: pluginOptions } = ctx.plugins.bankId;

    // Find session in database
    const session = await ctx.repos.bankIdSessionRepo.getSession(orderRef, "auth");

    if (!session) {
        throw notFound("BankId session not found");
    }

    // Session is completed, create tokens
    if (session.status === "complete") {
        // Validate that user data is present
        if (!session.user) {
            log.error(`Auth session ${orderRef} marked complete but user data is missing`);
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "USER_DATA_MISSING");
            throw internalServerError("Session is completed but user data is missing");
        }

        // Invoke host app callback which will (probably) do the following:
        // - Get user by personal number
        // - Create user if not found
        // - Create access token
        // If host app throws for example notFound error, this will be propagated as response here
        const authCallbackRes = await pluginOptions.onAuthSuccess(session.user, session.device?.ipAddress, session.payload);

        return {
            status: "complete",
            orderRef,
            token: authCallbackRes.token,
            user: authCallbackRes.user,
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
