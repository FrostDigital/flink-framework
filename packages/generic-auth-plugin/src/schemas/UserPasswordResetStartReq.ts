export interface UserPasswordResetStartReq{
    username : string;
    template?: string;
    additionalAuth?: string;
}