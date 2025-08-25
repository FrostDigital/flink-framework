import { Handler, RouteProps, badRequest, log, notFound } from "@flink-app/flink";
import { Ctx } from "../BankIdPluginContext";
import AuthStatusRes from "../schemas/AuthStatusRes";

export const Route: RouteProps = {
    path: "/bankid/auth/:orderRef",
};

const GetBankIdAuth: Handler<Ctx, any, AuthStatusRes, { orderRef: string }> = async ({ ctx, req }) => {
    const { orderRef } = req.params;
    const { options } = ctx.plugins.bankId;

    // Find session in database
    const session = await ctx.repos.bankIdSessionRepo.getSession(orderRef, "auth");

    if (!session) {
        return notFound("BankId session not found");
    }

    // Session is completed, create tokens
    if (session.status === "complete") {
        // Validate that user data is present
        if (!session.user) {
            log.error(`Auth session ${orderRef} marked complete but user data is missing`);
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "USER_DATA_MISSING");
            return badRequest("User data is missing");
        }

        // Invoke host app callback which will (probably) do the following:
        // - Get user by personal number
        // - Create user if not found
        // - Create access token
        // If host app throws for example notFound error, this will be propagated as response here
        const authCallbackRes = await options.onAuthSuccess(session.user, session.device?.ipAddress);

        return {
            data: {
                status: "complete",
                orderRef,
                token: authCallbackRes.token,
                user: authCallbackRes.user,
            },
        };
    }

    // If session failed or cancelled, return status
    if (session.status === "failed" || session.status === "cancelled") {
        return {
            data: {
                status: session.status,
                orderRef,
                errorCode: session.errorCode || undefined,
            },
        };
    }

    return {
        data: {
            status: "pending",
            orderRef,
            hintCode: session.hintCode || undefined,
        },
    };
};

export default GetBankIdAuth;
