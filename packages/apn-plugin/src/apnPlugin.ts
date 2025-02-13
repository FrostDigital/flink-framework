import { FlinkPlugin } from "@flink-app/flink";
import apn from "@parse/node-apn";

import ApnMessage from "./schemas/ApnMessage";

export type ApnPluginOptions = {
    certificate: {
        /**
         * Base64 encoded string for your APNs certificate (in PEM format).
         */
        cert: string;
        /**
         * Base64 encoded string for your APNs private key (in PEM format).
         */
        key: string;
        /**
         * Optional passphrase for the private key, if needed.
         */
        passphrase?: string;
    };
    production: boolean;
    /**
     * Default topic for your APNs notifications.
     * For VoIP pushes this is typically your app's bundle id with a `.voip` suffix,
     * e.g. "com.example.myapp.voip".
     */
    topic: string;
    /**
     * Default priority for your APNs notifications.
     */
    defaultPriority?: number;
};

export const apnPlugin = (options: ApnPluginOptions): FlinkPlugin => {
    // Decode the base64 encoded certificate and key.
    const decodedCert = Buffer.from(options.certificate.cert, "base64").toString("utf8");
    const decodedKey = Buffer.from(options.certificate.key, "base64").toString("utf8");

    // Initialize the APNs provider using certificate-based authentication.
    const provider = new apn.Provider({
        cert: decodedCert,
        key: decodedKey,
        passphrase: options.certificate.passphrase,
        production: options.production,
    });

    return {
        id: "apn",
        ctx: {
            /**
             * Sends a VoIP push notification.
             * @param message - The message to be sent. Expected to include:
             *  - `to`: an array of device tokens,
             *  - `alert`: (optional) text to display,
             *  - `payload`: (optional) any extra data,
             *  - `topic`: (optional) override the default APNs topic.
             */
            send: async (message: ApnMessage) => {
                if (!message.to || message.to.length === 0) {
                    throw new Error("No device tokens provided in message.to");
                }

                const notification = new apn.Notification();

                notification.pushType = message.pushType || "alert";

                // Set the priority to the default or the provided value.
                notification.priority = message.priority || options.defaultPriority || 10;

                // Use the topic provided in the message or fall back to the plugin's default.
                notification.topic = message.topic || options.topic;
                if (!notification.topic) {
                    throw new Error("APNs topic must be provided either in the message or in plugin options");
                }

                // Set any provided alert and payload properties.
                if (message.alert) {
                    notification.alert = message.alert;
                }
                if (message.payload) {
                    notification.payload = message.payload;
                }

                try {
                    const result = await provider.send(notification, message.to);
                    console.log("APNs push result:", result);
                    return result;
                } catch (err) {
                    console.error("Error sending APNs push:", err);
                    throw err;
                }
            },
        },
        init: async (app) => {
            // Optionally, add a message handler to your framework.
            // Adjust permissions or handler names as required by your app.
            // Example:
            // app.addHandler("PostMessage", {
            //   permissions: [options.permissions?.send || "apn:send"],
            // });
        },
    };
};
