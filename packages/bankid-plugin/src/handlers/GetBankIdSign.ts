import { Handler, RouteProps, badRequest, log, notFound } from "@flink-app/flink";
import { Ctx } from "../BankIdPluginContext";
import SignStatusRes from "../schemas/SignStatusRes";

export const Route: RouteProps = {
    path: "/bankid/sign/:orderRef",
};

const GetBankidSign: Handler<Ctx, any, SignStatusRes, { orderRef: string }> = async ({ ctx, req }) => {
    const { orderRef } = req.params;
    const { options } = ctx.plugins.bankId;

    // Find session in database
    const session = await ctx.repos.bankIdSessionRepo.getSession(orderRef, "sign");

    if (!session) {
        return notFound("BankId session not found");
    }

    // Session is completed, invoke callback
    if (session.status === "complete") {
        // Validate that user data is present
        if (!session.user) {
            log.error(`Sign session ${orderRef} marked complete but user data is missing`);
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "USER_DATA_MISSING");
            return badRequest("User data is missing");
        }

        // Validate that signature data is present
        if (!session.signature) {
            log.error(`Sign session ${orderRef} marked complete but signature data is missing`);
            await ctx.repos.bankIdSessionRepo.failSession(orderRef, "SIGNATURE_DATA_MISSING");
            return badRequest("Signature data is missing");
        }

        const signature = {
            signature: session.signature.signature,
            ocspResponse: session.signature.ocspResponse,
        };

        // Invoke host app callback
        const signCallbackRes = await options.onSignSuccess(session.user, signature);

        return {
            data: {
                status: "complete",
                orderRef,
                user: signCallbackRes.user,
                signature: signCallbackRes.signature,
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

export default GetBankidSign;
