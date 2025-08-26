import { FlinkRequest } from "@flink-app/flink";
import { BankIdUserData } from "./schemas/BankIdSession";

export interface BankIdUserInfo {
    personalNumber: string;
    name: string;
    givenName: string;
    surname: string;
}

export interface BankIdSignature {
    signature: string;
    ocspResponse: string;
}

export interface AuthSuccessCallbackResponse {
    user: any;
    token: string;
}

export interface BankIdPluginOptions {
    /**
     * BankID PFX certificate in base64 format
     */
    pfxBase64: string;

    /**
     * Passphrase to certificate
     */
    passphrase: string;

    /**
     * If production is true, the plugin will use the production BankID environment.
     * If false, it will use the test environment.
     *
     * Default is false.
     */
    production?: boolean;

    /**
     * Whether to allow requests without an end user IP address.
     * If true default 127.0.0.1 will be used, which is not recommended for production.
     */
    allowNoIp?: boolean;

    /**
     * Callback to get the end user IP address if any specific way of obtaining it is needed.
     * For example getting it from `X-Forwarded-For` header.
     * @param req
     * @returns
     */
    onGetEndUserIp: (req: FlinkRequest) => Promise<string>;

    /**
     * Callback invoked when BankID auth is successful.
     * Callback must return an object containing user information and
     * token. This will be relayed in the collect response to client.
     * @param userData
     * @param ip
     * @param payload
     * @returns
     */
    onAuthSuccess: (userData: BankIdUserData, ip?: string, payload?: Record<string, any>) => Promise<AuthSuccessCallbackResponse>;

    /**
     * Callback invoked when BankID sign is successful.
     * Callback must return an object containing user information and
     * signature data. This will be relayed in the collect response to client.
     * @param userData
     * @param signature
     * @param payload
     * @returns
     */
    onSignSuccess?: (userData: BankIdUserData, signature: BankIdSignature, payload?: Record<string, any>) => Promise<void>;

    /**
     * For how long to keep sessions in database.
     * This has nothing to do with how long the user is logged in, only
     * for how long we keep historical data of bankid sessions - data retention.
     *
     * An expiring index will be created in the database to automatically remove old sessions
     * based on this.
     *
     * Default is 24 hours (86400 seconds)
     */
    keepSessionsSec?: number;

    /**
     * The name of the MongoDB collection to use for storing BankID sessions.
     * Default is "bankid_sessions".
     */
    bankIdSessionsCollectionName?: string;

    /**
     * Whether to register the default HTTP routes for BankID operations.
     * If false, you'll need to implement your own handlers using the functions.
     * Default is true.
     */
    registerRoutes?: boolean;
}
