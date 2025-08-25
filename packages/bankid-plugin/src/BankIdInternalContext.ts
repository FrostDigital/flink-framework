import { FlinkContext } from "@flink-app/flink";
import { BankIdPluginContext } from "./BankIdPluginContext";
import BankIdSessionRepo from "./repos/BankIdSessionRepo";

export interface BankIdInternalCtx extends FlinkContext<BankIdPluginContext> {
    repos: {
        bankIdSessionRepo: BankIdSessionRepo;
    };
}
