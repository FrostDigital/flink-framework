import { UserPasswordResetSettings } from "./schemas/UserPasswordResetSettings";

export interface genericAuthPluginOptions{
    repoName : string,  
    enableRoutes? : boolean,
    enablePasswordReset? : boolean,
    enablePushnotificationTokens : boolean,
    passwordResetSettings? : UserPasswordResetSettings,

    createPasswordHashAndSaltMethod? : { (password : string) : Promise<{ hash: string; salt: string;} | null>  },
    validatePasswordMethod? : { (password : string, hash : string, salt : string) : Promise<boolean>  } 


 }

