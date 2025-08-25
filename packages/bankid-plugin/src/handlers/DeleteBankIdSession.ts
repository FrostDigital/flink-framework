import { Handler, HttpMethod, RouteProps, badRequest, internalServerError, notFound } from "@flink-app/flink";
import SessionCancelRes from "../schemas/SessionCancelRes";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import { cancelSession } from "../functions/cancelSession";

export const Route: RouteProps = {
    path: "/bankid/session/:orderRef",
    method: HttpMethod.delete,
};

const DeleteBankIdSession: Handler<BankIdInternalCtx, any, SessionCancelRes, { orderRef: string }> = async ({ ctx, req }) => {
    const { orderRef } = req.params;

    try {
        const cancelResponse = await cancelSession(ctx, { orderRef });

        return {
            data: cancelResponse,
        };
    } catch (error: any) {
        if (error.message === "Session not found") {
            return notFound("Session not found");
        }
        if (error.message?.includes("Cannot cancel")) {
            return badRequest(error.message, "SESSION_ALREADY_COMPLETED");
        }
        return internalServerError("Failed to cancel session");
    }
};

export default DeleteBankIdSession;
