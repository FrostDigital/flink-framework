export interface UserPasswordResetCompleteRes{
    status : "success" | "userNotFound" | "invalidCode" | "passwordError";
}