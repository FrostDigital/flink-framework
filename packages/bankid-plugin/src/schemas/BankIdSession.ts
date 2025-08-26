import { BankIdSignature } from "../BankIdPluginOptions";

export interface BankIdUserData {
    personalNumber: string;
    name: string;
    givenName: string;
    surname: string;
}

export default interface BankIdSession {
    _id?: string;
    orderRef: string;
    type: "auth" | "sign";
    status: "pending" | "complete" | "failed" | "cancelled";
    user?: BankIdUserData;
    device?: {
        ipAddress: string;
    };
    signature?: BankIdSignature;
    createdAt: Date;
    updatedAt?: Date;
    completedAt?: Date;
    errorCode?: string | null;
    hintCode?: string | null;
    ip: string;
    autoStartToken: string;
    payload?: Record<string, any>;
    qr?: {
        qrStartToken: string;
        qrStartSecret: string;
        /**
         * Base64 encoded QR code image (?)
         */
        qr?: string;
    };
}
