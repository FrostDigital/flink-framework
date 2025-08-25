import { BankIdClientV6 } from "bankid";
import { BankIdPluginOptions } from "./BankIdPluginOptions";
import { SignOptions, SignResponse } from "./functions/sign";
import { AuthOptions, AuthResponse } from "./functions/auth";
import { AuthStatusOptions, AuthStatusResponse } from "./functions/getAuthStatus";
import { SignStatusOptions, SignStatusResponse } from "./functions/getSignStatus";
import { CancelSessionOptions, CancelSessionResponse } from "./functions/cancelSession";

export interface BankIdPluginContext {
    bankId: {
        bankIdClient: BankIdClientV6;
        options: BankIdPluginOptions;
        auth: (options?: AuthOptions) => Promise<AuthResponse>;
        sign: (options: SignOptions) => Promise<SignResponse>;
        getAuthStatus: (options: AuthStatusOptions) => Promise<AuthStatusResponse>;
        getSignStatus: (options: SignStatusOptions) => Promise<SignStatusResponse>;
        cancelSession: (options: CancelSessionOptions) => Promise<CancelSessionResponse>;
    };
}
