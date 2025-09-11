import { UserProfile } from "./UserProfile";

export interface UserCreateReq {
    username: string;
    password?: string;
    personalNumber?: string;
    authentificationMethod?: "password" | "sms" | "bankid";
    profile?: UserProfile;
}
