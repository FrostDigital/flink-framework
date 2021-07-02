import { UserProfile } from "./UserProfile";

export interface UserLoginRes {
    status : "success" | "failed" | "requiresValidation"
    user? : {
        _id : string;
        username : string;
        token : string;
        profile : UserProfile
    },
    validationToken? : string

}