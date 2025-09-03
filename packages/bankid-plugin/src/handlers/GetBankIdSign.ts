import { Handler, HttpMethod, RouteProps } from "@flink-app/flink";
import { BankIdInternalCtx } from "../BankIdInternalContext";
import { getSignStatus } from "../functions/getSignStatus";
import SignStatusRes from "../schemas/SignStatusRes";

export const Route: RouteProps = {
    path: "/bankid/sign/:orderRef",
    method: HttpMethod.get,
};

const GetBankIdSign: Handler<BankIdInternalCtx, any, SignStatusRes, { orderRef: string }> = async ({ ctx, req }) => {
    const { orderRef } = req.params;

    const signStatus = await getSignStatus(ctx, { orderRef });

    return {
        data: signStatus,
    };
};

export default GetBankIdSign;
