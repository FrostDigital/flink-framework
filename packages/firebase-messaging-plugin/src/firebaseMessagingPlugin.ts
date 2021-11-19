import { FlinkPlugin, log } from "@flink-app/flink";
import FCM from "fcm-push";
import * as PostMessage from "./handlers/PostMessage";
import Message from "./schemas/Message";

export type FirebaseMessagingPluginOptions = {
  /**
   * Firebase server key
   */
  serverKey: string;

  /**
   * If to expose endpoints for sending push notification.
   */
  exposeEndpoints?: boolean;

  permissions?: {
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
      app.addHandler(PostMessage, {
        permissions: [options.permissions?.send || "firebase-messaging:send"],
      });
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
