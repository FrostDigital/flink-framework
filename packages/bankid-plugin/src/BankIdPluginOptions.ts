import { FlinkAuthPlugin, FlinkAuthUser } from "@flink-app/flink";

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

export interface BankIdPluginOptions {
  pfxBase64: string;
  passphrase: string;
  production?: boolean;
  
  authPlugin: FlinkAuthPlugin;
  getUserByPersonalNumber: (personalNumber: string) => Promise<FlinkAuthUser | null>;
  createUserFromBankId?: (bankIdUser: BankIdUserInfo) => Promise<FlinkAuthUser>;
  
  onBeforeAuth?: (personalNumber: string, ip: string) => Promise<void>;
  onAfterSuccessfulAuth?: (user: FlinkAuthUser, bankIdInfo: BankIdUserInfo) => Promise<void>;
  onBeforeSign?: (user: FlinkAuthUser, document: any) => Promise<void>;
  onAfterSuccessfulSign?: (user: FlinkAuthUser, signature: BankIdSignature) => Promise<void>;
  onAuthFailure?: (personalNumber: string, reason: string) => Promise<void>;
  onSignFailure?: (user: FlinkAuthUser, reason: string) => Promise<void>;
}