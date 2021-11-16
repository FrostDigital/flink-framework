import { FlinkRepo } from "@flink-app/flink";
import { StripeAPI } from "./stripeAPI";

export interface stripePluginContext {
    stripePlugin: {
        callbackTest(): void;
        stripeAPI: StripeAPI;
    };
}
