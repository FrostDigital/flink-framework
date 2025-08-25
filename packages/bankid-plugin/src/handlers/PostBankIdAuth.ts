import { Handler, HttpMethod, RouteProps, internalServerError } from "@flink-app/flink";
import AuthInitiateReq from "../schemas/AuthInitiateReq";
import AuthInitiateRes from "../schemas/AuthInitiateRes";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import { auth } from "../functions/auth";

export const Route: RouteProps = {
    path: "/bankid/auth",
    method: HttpMethod.post,
};

const PostBankIdAuth: Handler<BankIdInternalCtx, AuthInitiateReq, AuthInitiateRes> = async ({ ctx, req }) => {
    const { options } = ctx.plugins.bankId;

    try {
        let clientIp = await options.onGetEndUserIp(req);

        const authResponse = await auth(ctx, { endUserIp: clientIp });

        return {
            data: authResponse,
        };
    } catch (error: any) {
        return internalServerError(error.message || "Failed to initiate BankID authentication");
    }
};

export default PostBankIdAuth;
