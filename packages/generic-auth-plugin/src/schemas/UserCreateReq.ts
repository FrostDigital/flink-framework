import { UserProfile } from "./UserProfile";

export interface UserCreateReq{
    username: string;
    password?: string;
    authentificationMethod? : "password" | "sms"
    profile? : UserProfile
}