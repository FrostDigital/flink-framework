import { FlinkContext } from "@flink-app/flink";
import ConnectSessionRepo from "./reposx/ConnectSessionRepo";
import { StripeAPI } from "./stripeAPI";
export interface Ctx extends FlinkContext {
    repos: {
        connectSessionRepo: ConnectSessionRepo;
    };
    stripeAPI: StripeAPI;
    templates: {
        master: string;
        style: string;
        setupCard: string;
        error: string;
        setupDone: string;
        paySelectCard: string;
        payEnterCard: string;
        connectDone: string;
    };
}
