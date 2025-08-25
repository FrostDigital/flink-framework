import { log } from "@flink-app/flink";
import { QrGenerator } from "bankid";
import { BankIdInternalCtx } from "./BankIdInternalContext";

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const bankIdQrTimeoutSec = 30;

/**
 * This is the loop that continuously checks for new QR codes and updates the session status.
 * When user polls/collects status using other endpoint this is still where the status is updated.
 *
 * Note that this loops is still used even if auto start token is used instead of QR code.
 *
 * @param ctx
 * @param orderRef
 * @param qrGenerator
 * @returns Promise that resolves with the first QR code, while continuing to generate QR codes in the background
 */
export async function checkAndGenerateQr(ctx: BankIdInternalCtx, orderRef: string, qrGenerator: QrGenerator): Promise<string> {
    const qrIterator = qrGenerator.nextQr(orderRef, { timeout: bankIdQrTimeoutSec });

    // Get the first QR code to return immediately
    const firstQrResult = await qrIterator.next();
    const firstQrCode = firstQrResult.value || "";

    // Continue the loop in the background
    (async () => {
        for await (const newQrCode of qrIterator) {
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
                    signature: completionData?.signature,
                });
                break;
            } else if (resp.status === "failed") {
                await ctx.repos.bankIdSessionRepo.failSession(orderRef, "BANKID_SIGN_FAILED", resp.hintCode);
                break;
            }

            await new Promise((r) => setTimeout(r, 2000));
        }
    })().catch((error) => {
        log.error("Error in background QR generation loop:", error);
    });

    return firstQrCode;
}
