export interface UserPasswordResetCompleteRes {
    status: "success" | "userNotFound" | "invalidCode" | "passwordError";

    /**
     * The user object is returned only if the status is "success".
     */
    user?: any;
}
