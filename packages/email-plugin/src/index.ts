import { FlinkApp, FlinkPlugin } from "@flink-app/flink";
import { client } from "./schemas/client";
export { sendgridClient } from "./sendgridClient";
export { smtpClient } from "./smtpClient";
export type { email } from "./schemas/email";

export type emailPluginOptions = {
  /**
   * Path for request
   */
  client: client;
};

export interface emailPluginContext {
  emailPlugin: {
    client: client;
  };
}

export const emailPlugin = (options: emailPluginOptions): FlinkPlugin => {
  return {
    id: "emailPlugin",
    init: (app) => init(app, options),
    ctx: {
      client: options.client,
    },
  };
};

function init(app: FlinkApp<any>, options: emailPluginOptions) {}
