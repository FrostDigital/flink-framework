import { UserProfile } from "./UserProfile";

interface EmailConfig {
    from_address: string;
    subject: string;
    html: string;
}

interface EmailCtx {
    code?: string;
    passwordResetToken?: string;
    username: string;
    profile?: UserProfile;
}

export interface UserPasswordResetSettings {
    email: EmailConfig | ((emailCtx: EmailCtx) => EmailConfig);
    code: {
        numberOfDigits: number;
        lifeTime: string;
        jwtSecret: string;
    };
    enablePasswordResetForm?: boolean;
    passwordResetForm?: string;
    resetPasswordFormBaseUrl?: string;
    passwordResetReusableTokens?: boolean;

}
