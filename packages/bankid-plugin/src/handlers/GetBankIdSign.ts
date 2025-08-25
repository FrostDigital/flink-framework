import { Handler, HttpMethod, RouteProps, internalServerError, notFound } from "@flink-app/flink";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import SignStatusRes from "../schemas/SignStatusRes";
import { getSignStatus } from "../functions/getSignStatus";

export const Route: RouteProps = {
    path: "/bankid/sign/:orderRef",
    method: HttpMethod.get,
};

const GetBankIdSign: Handler<BankIdInternalCtx, any, SignStatusRes, { orderRef: string }> = async ({ ctx, req }) => {
    const { orderRef } = req.params;

    try {
        const signStatus = await getSignStatus(ctx, { orderRef });

        return {
            data: signStatus,
        };
    } catch (error: any) {
        if (error.message === "BankId session not found") {
            return notFound("BankId session not found");
        }
        return internalServerError(error.message || "Failed to get sign status");
    }
};

export default GetBankIdSign;
