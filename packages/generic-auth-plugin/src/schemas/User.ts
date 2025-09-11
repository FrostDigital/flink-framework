import { PushNotificationToken } from "./PushNotificationToken";
import { UserProfile } from "./UserProfile";

export interface User {
    _id: string;
    username: string;
    personalNumber?: string;

    password?: string;
    salt?: string;

    pwdResetStartedAt?: string | null;
    roles: string[];

    authentificationMethod: "password" | "sms" | "bankid";
    profile: UserProfile;
    pushNotificationTokens: Array<PushNotificationToken>;
}
