import { UserPasswordResetSettings } from "./schemas/UserPasswordResetSettings";
import { client as smsClient } from "@flink-app/sms-plugin";
export interface GenericAuthPluginOptions {
    repoName: string;
    enableRoutes?: boolean;
    enablePasswordReset?: boolean;
    enablePushNotificationTokens?: boolean;
    passwordResetSettings?: UserPasswordResetSettings;
    enableUserCreation?: boolean;
    enableProfileUpdate?: boolean;
    enablePasswordUpdate?: boolean;
    baseUrl?: string;
    pluginId?: string;
    createPasswordHashAndSaltMethod?: {
        (password: string): Promise<{ hash: string; salt: string } | null>;
    };
    validatePasswordMethod?: {
        (password: string, hash: string, salt: string): Promise<boolean>;
    };

    usernameFormat?: RegExp;
    sms?: GenericAuthsmsOptions;
}

export interface GenericAuthsmsOptions {
    smsClient: smsClient;
    smsFrom: string;
    smsMessage: string;
    jwtToken: string;
    codeType: "numeric" | "alphanumeric";
    codeLength: number;
}
