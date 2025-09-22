import { FlinkRequest } from "@flink-app/flink";
import { User } from "./schemas/User";
import { UserPasswordResetSettings } from "./schemas/UserPasswordResetSettings";
import { client as smsClient } from "@flink-app/sms-plugin";
export interface GenericAuthPluginOptions {
    repoName: string;
    enableRoutes?: boolean;
    enablePasswordReset?: boolean;
    passwordResetReusableTokens?: boolean;
    enablePushNotificationTokens?: boolean;
    passwordResetSettings?: UserPasswordResetSettings;
    enableUserCreation?: boolean;
    enableProfileUpdate?: boolean;
    enablePasswordUpdate?: boolean;
    enableUserLogin?: boolean;
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
    onSuccessfulLogin?: {
        (user: User, req?: FlinkRequest): Promise<void>;
    };
    onUserCreated?: {
        (user: User): Promise<void>;
    };
    /**
     * If true, when a new device is registered, all other devices identified by `deviceId`
     * will be deregistered to avoid duplicate notifications.
     *
     * Also as safety measure, any usage of the same firebase token on other users will be
     * deregistered.
     */
    deregisterOtherDevices?: boolean;

    /**
     * If true, multiple devices can be registered with the same `deviceId`.
     * Default is `true`.
     */
    allowMultipleDevices?: boolean;
}

export interface GenericAuthsmsOptions {
    smsClient: smsClient;
    smsFrom: string;
    smsMessage: string;
    jwtToken: string;
    codeType: "numeric" | "alphanumeric";
    codeLength: number;
}
