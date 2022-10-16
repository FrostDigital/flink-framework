import { FlinkApp, FlinkPlugin } from "@flink-app/flink";
import { client } from "./schemas/client";
export type { sms } from "./schemas/sms";
export { sms46elksClient } from "./sms46elksClient";

export type smsPluginOptions = {
    /**
     * Path for request
     */
    client: client;
};

export interface smsPluginContext {
    smsPlugin: {
        client: client;
    };
}

export const smsPlugin = (options: smsPluginOptions): FlinkPlugin => {
    return {
        id: "smsPlugin",
        init: (app) => init(app, options),
        ctx: {
            client: options.client,
        },
    };
};

function init(app: FlinkApp<any>, options: smsPluginOptions) {}
