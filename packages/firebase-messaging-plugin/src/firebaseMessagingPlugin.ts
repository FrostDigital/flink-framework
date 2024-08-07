import { FlinkPlugin, log } from "@flink-app/flink";

import * as PostMessage from "./handlers/PostMessage";
import Message from "./schemas/Message";
import admin from "firebase-admin";

export type FirebaseMessagingPluginOptions = {
    /**
     * Firebase server key
     */

    serviceAccountKey: string;

    /**
     * If to expose endpoints for sending push notification.
     */
    exposeEndpoints?: boolean;

    permissions?: {
        send: string;
    };
};

export const firebaseMessagingPlugin = (options: FirebaseMessagingPluginOptions): FlinkPlugin => {
    const decodedKey = Buffer.from(options.serviceAccountKey, "base64").toString("utf-8");

    const adminAdpp = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(decodedKey)),
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
async function send(message: Message, adminApp: admin.app.App) {
    const messages = message.to.map((to) => {
        const { to: toArray, ...rest } = message;
        return { ...rest, token: to };
    });

    // Split messages into batches of 500
    const batchSize = 500;
    for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        try {
            const response = await adminApp.messaging().sendEach(batch);
            response.responses.forEach((res, idx) => {
                if (res.success) {
                    log.debug(`[firebaseMessaging] Successfully sent to device ${batch[idx].token}`);
                } else {
                    log.debug(`[firebaseMessaging] Failed sending to device ${batch[idx].token}: ${res.error}`);
                }
            });
        } catch (err: any) {
            log.debug(`[firebaseMessaging] Failed sending batch: ${err}`);
        }
    }
}
