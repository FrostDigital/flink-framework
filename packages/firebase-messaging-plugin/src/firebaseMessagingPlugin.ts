import {
  FlinkContext,
  FlinkPlugin,
  Handler,
  HttpMethod,
  log,
} from "@flink-app/flink";
import FCM from "fcm-push";
import schemas from "../.flink/schemas.json";
import { FirebaseMessagingContext } from "./FirebaseMessagingContext";
import Message from "./schemas/Message";
import SendResult from "./schemas/SendResult";

export type FirebaseMessagingPluginOptions = {
  /**
   * Firebase server key
   */
  serverKey: string;

  /**
   * If to expose endpoints for sending push notification.
   */
  exposeEndpoints?: boolean;

  // /**
  //  * If endpoints should be accessible without need to be
  //  * authenticated.
  //  *
  //  * Only applicable if `exposeEndpoints` is true.
  //  */
  // allowPublicAccess?: boolean;

  scopes?: {
    send: string;
  };
};

export const firebaseMessagingPlugin = (
  options: FirebaseMessagingPluginOptions
): FlinkPlugin => {
  const fcmClient = new FCM(options.serverKey);

  return {
    id: "firebaseMessaging",
    ctx: {
      fcmClient,
      send: (message: Message) => send(message, fcmClient),
    },
    init: async (app) => {
      app.addHandler(
        {
          routeProps: {
            method: HttpMethod.post,
            path: "/send-message",
            docs: "Publishes push notification to one or multiple devices",
            permissions: [options.scopes?.send || "firebase-messaging:send"],
          },
          schema: {
            reqSchema: schemas.Message,
            resSchema: schemas.SendResult,
          },
        },
        sendHandler
      );
    },
  };
};

/**
 * Send push notification.
 */
function send(message: Message, fcmClient: any) {
  const messages = message.to.map((to) => {
    return { ...message, to };
  });

  return Promise.all(
    messages.map((m) =>
      fcmClient
        .send(m)
        .catch((err: any) =>
          log.debug(
            `[firebaseMessaging] Failed sending to device ${m.to}: ${err}`
          )
        )
    )
  );
}

const sendHandler: Handler<
  FlinkContext<FirebaseMessagingContext>,
  Message,
  SendResult
> = async ({ ctx, req }) => {
  await ctx.plugins.firebaseMessaging.send(req.body);

  return {
    data: { failedDevices: [] }, // TODO
  };
};
