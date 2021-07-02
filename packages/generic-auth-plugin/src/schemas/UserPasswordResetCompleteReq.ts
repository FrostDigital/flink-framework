export interface UserPasswordResetCompleteReq{
    passwordResetToken : string;
    code : string,
    password : string
}