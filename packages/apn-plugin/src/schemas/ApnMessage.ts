import { NotificationPushType } from "@parse/node-apn";

export default interface ApnMessage {
    /**
     * Devices to send to
     */
    to: string[];

    alert?: string;

    payload: { [x: string]: string };

    topic?: string;

    pushType?: NotificationPushType;

    priority?: number;
}
