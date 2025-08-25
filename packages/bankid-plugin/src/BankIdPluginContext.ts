import { FlinkContext } from "@flink-app/flink";
import { BankIdClientV6 } from "bankid";
import BankIdSessionRepo from "./repos/BankIdSessionRepo";
import { BankIdPluginOptions } from "./BankIdPluginOptions";
import { SignOptions, SignResponse } from "./functions/sign";

export interface BankIdPluginContext {
    bankId: {
        bankIdClient: BankIdClientV6;
        options: BankIdPluginOptions;
        sign: (options: SignOptions) => Promise<SignResponse>;
    };
}

export interface Ctx extends FlinkContext<BankIdPluginContext> {
    repos: {
        bankIdSessionRepo: BankIdSessionRepo;
    };
}
