import { log } from "@flink-app/flink";
import { BankIdInternalCtx } from "../BankIdInternalContext";

export interface CancelSessionOptions {
    orderRef: string;
}

export interface CancelSessionResponse {
    success: boolean;
    message: string;
}

export async function cancelSession(ctx: BankIdInternalCtx, options: CancelSessionOptions): Promise<CancelSessionResponse> {
    const { orderRef } = options;
    const { bankIdClient } = ctx.plugins.bankId;

    // Find session in database
    const session = await ctx.repos.bankIdSessionRepo.getSession(orderRef);

    if (!session) {
        throw new Error("Session not found");
    }

    // If session is already completed or failed, can't cancel
    if (session.status === "complete" || session.status === "failed") {
        throw new Error(`Cannot cancel ${session.status} session`);
    }

    // If already cancelled, return success
    if (session.status === "cancelled") {
        return {
            success: true,
            message: "Session already cancelled",
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
        success: true,
        message: "Session cancelled successfully",
    };
}