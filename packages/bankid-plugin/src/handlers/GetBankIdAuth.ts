import { Handler, HttpMethod, RouteProps, internalServerError, notFound } from "@flink-app/flink";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import AuthStatusRes from "../schemas/AuthStatusRes";
import { getAuthStatus } from "../functions/getAuthStatus";

export const Route: RouteProps = {
    path: "/bankid/auth/:orderRef",
    method: HttpMethod.get,
};

const GetBankIdAuth: Handler<BankIdInternalCtx, any, AuthStatusRes, { orderRef: string }> = async ({ ctx, req }) => {
    const { orderRef } = req.params;

    try {
        const authStatus = await getAuthStatus(ctx, { orderRef });

        return {
            data: authStatus,
        };
    } catch (error: any) {
        if (error.message === "BankId session not found") {
            return notFound("BankId session not found");
        }
        return internalServerError(error.message || "Failed to get auth status");
    }
};

export default GetBankIdAuth;
