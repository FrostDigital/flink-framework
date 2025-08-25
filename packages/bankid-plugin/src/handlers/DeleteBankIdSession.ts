import { Handler, RouteProps, badRequest, internalServerError, log, notFound } from "@flink-app/flink";
import { Ctx } from "../BankIdPluginContext";
import SessionCancelRes from "../schemas/SessionCancelRes";

export const Route: RouteProps = {
    path: "/bankid/session/:orderRef",
};

const DeleteBankidSession: Handler<Ctx, any, SessionCancelRes, { orderRef: string }> = async ({ ctx, req }) => {
    try {
        const { orderRef } = req.params;
        const { bankIdClient } = ctx.plugins.bankId;

        // Find session in database
        const session = await ctx.repos.bankIdSessionRepo.getSession(orderRef);

        if (!session) {
            return notFound("Session not found");
        }

        // If session is already completed or failed, can't cancel
        if (session.status === "complete" || session.status === "failed") {
            return badRequest(`Cannot cancel ${session.status} session`, "SESSION_ALREADY_COMPLETED");
        }

        // If already cancelled, return success
        if (session.status === "cancelled") {
            return {
                data: {
                    success: true,
                    message: "Session already cancelled",
                },
            };
        }

        try {
            // Try to cancel with BankID service
            await bankIdClient.cancel({ orderRef });
        } catch (error: any) {
            // BankID cancel might fail if session is already completed/expired
            // Log but don't fail - we still want to mark our session as cancelled
            log.warn("BankID cancel request failed:", error.message);
        }

        // Update session status to cancelled
        await ctx.repos.bankIdSessionRepo.cancelSession(orderRef);

        return {
            data: {
                success: true,
                message: "Session cancelled successfully",
            },
        };
    } catch (error: any) {
        console.error("Session cancellation error:", error);
        return internalServerError("Failed to cancel session");
    }
};

export default DeleteBankidSession;
