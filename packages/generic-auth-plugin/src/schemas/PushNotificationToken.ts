export interface PushNotificationToken {
    deviceId: string;
    token: string;
    platform?: "ios" | "android" | "web";
}
