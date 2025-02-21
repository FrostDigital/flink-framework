export interface UserPasswordResetStartReq{
    username : string;
    type?: string;
    additionalAuth?: string;
}