export interface PushNotificationToken {
    deviceId: string;
    token: string;
    platform?: "ios" | "android" | "web";

    /**
     * The type of the token. This is used to determine which push notification service to use.
     * Default is "firebase"
     */
    type?: "firebase" | "apn-voip";
}
