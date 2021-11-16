import { FlinkContext } from "@flink-app/flink";
import { StripeAPI } from "./stripeAPI";
export interface Ctx extends FlinkContext {
    repos: {};
    stripeAPI: StripeAPI;
    templates: {
        master: string;
        style: string;
        setupCard: string;
        error: string;
    };
}
