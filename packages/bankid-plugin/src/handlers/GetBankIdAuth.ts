import { Handler, HttpMethod, RouteProps } from "@flink-app/flink";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import { getAuthStatus } from "../functions/getAuthStatus";
import AuthStatusRes from "../schemas/AuthStatusRes";

export const Route: RouteProps = {
    path: "/bankid/auth/:orderRef",
    method: HttpMethod.get,
};

const GetBankIdAuth: Handler<BankIdInternalCtx, any, AuthStatusRes, { orderRef: string }> = async ({ ctx, req }) => {
    const { orderRef } = req.params;

    const authStatus = await getAuthStatus(ctx, { orderRef });

    return {
        data: authStatus,
    };
};

export default GetBankIdAuth;
