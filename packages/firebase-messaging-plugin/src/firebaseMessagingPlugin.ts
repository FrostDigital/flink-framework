import { FlinkPlugin, log } from "@flink-app/flink";

import * as PostMessage from "./handlers/PostMessage";
import Message from "./schemas/Message";
import admin from "firebase-admin"

export type FirebaseMessagingPluginOptions = {
  /**
   * Firebase server key
   */

  serviceAccountKey: string

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

  const decodedKey = Buffer.from(options.serviceAccountKey, "base64").toString("utf-8");

  const adminAdpp = admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(decodedKey))
  });


  return {
    id: "firebaseMessaging",
    ctx: {
      send: (message: Message) => send(message, adminAdpp),
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
function send(message: Message, adminApp: admin.app.App) {
  const messages = message.to.map((to) => {
    const { to : toArray, ...rest} = message;
    return { ...rest, token : to };
  });

  return Promise.all(
    messages.map((m) => {

      adminApp
        .messaging().send(m)
        .catch((err: any) =>
          log.debug(
            `[firebaseMessaging] Failed sending to device ${m.token}: ${err}`
          )
        )



    })

  );
}
