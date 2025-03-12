import { FlinkRepo } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { User } from "./schemas/User";
import { UserCreateRes } from "./schemas/UserCreateRes";
import { UserLoginRes } from "./schemas/UserLoginRes";
import { UserProfile } from "./schemas/UserProfile";
import { UserPasswordChangeRes } from "./schemas/UserPasswordChangeRes";
import { UserPasswordResetSettings } from "./schemas/UserPasswordResetSettings";
import { UserPasswordResetStartRes } from "./schemas/UserPasswordResetStartRes";
import { UserPasswordResetCompleteRes } from "./schemas/UserPasswordResetCompleteRes";
import { GenericAuthsmsOptions } from "./genericAuthPluginOptions";

export interface genericAuthContext {
    genericAuthPlugin: {
        loginUser(
            repo: FlinkRepo<any, User>,
            auth: JwtAuthPlugin,
            username: string,
            password?: string,
            validatePasswordMethod?: { (password: string, hash: string, salt: string): Promise<boolean> },
            smsOptions?: GenericAuthsmsOptions,
            onSuccessfulLogin?: (user: User) => Promise<void>
        ): Promise<UserLoginRes>;
        loginByToken(repo: FlinkRepo<any, User>, auth: JwtAuthPlugin, token: string, code: string, jwtSecret: string): Promise<UserLoginRes>;
        createUser(
            repo: FlinkRepo<any, User>,
            auth: JwtAuthPlugin,
            username: string,
            password: string,
            authentificationMethod: "password" | "sms",
            roles: string[],
            profile: UserProfile,
            createPasswordHashAndSaltMethod?: {
                (password: string): Promise<{ hash: string; salt: string } | null>;
            },
            onUserCreated?: (user: User) => Promise<void>
        ): Promise<UserCreateRes>;
        changePassword(
            repo: FlinkRepo<any, User>,
            auth: JwtAuthPlugin,
            userId: string,
            newPassword: string,
            createPasswordHashAndSaltMethod?: { (password: string): Promise<{ hash: string; salt: string } | null> }
        ): Promise<UserPasswordChangeRes>;
        passwordResetStart(
            repo: FlinkRepo<any, User>,
            auth: JwtAuthPlugin,
            jwtSecret: string,
            username: string,
            numberOfDigits?: number,
            lifeTime?: string,
            passwordResetReusableTokens?: boolean
        ): Promise<UserPasswordResetStartRes>;
        passwordResetComplete(
            repo: FlinkRepo<any, User>,
            auth: JwtAuthPlugin,
            jwtSecret: string,
            passwordResetToken: string,
            code: string,
            newPassword: string,
            createPasswordHashAndSaltMethod?: { (password: string): Promise<{ hash: string; salt: string } | null> },
            passwordResetReusableTokens?: boolean
        ): Promise<UserPasswordResetCompleteRes>;
        repoName: string;
        passwordResetSettings?: UserPasswordResetSettings;
        createPasswordHashAndSaltMethod?: { (password: string): Promise<{ hash: string; salt: string } | null> };
        validatePasswordMethod?: { (password: string, hash: string, salt: string): Promise<boolean> };
        usernameFormat: RegExp;
        smsOptions?: GenericAuthsmsOptions;
        onSuccessfulLogin?: { (user: User): Promise<void> };
        onUserCreated?: { (user: User): Promise<void> };
    };
}
