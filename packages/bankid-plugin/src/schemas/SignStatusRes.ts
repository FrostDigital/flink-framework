import { FlinkAuthUser } from "@flink-app/flink";
import { BankIdSignature } from "../BankIdPluginOptions";

export default interface SignStatusRes {
    status: "pending" | "complete" | "failed" | "cancelled";
    orderRef: string;
    user?: FlinkAuthUser;
    signature?: BankIdSignature;
    hintCode?: string;
    errorCode?: string;
}
