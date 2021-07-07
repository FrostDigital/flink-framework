import { UserPasswordResetSettings } from "./schemas/UserPasswordResetSettings";

export interface genericAuthPluginOptions{
    repoName : string,  
    enableRoutes? : boolean,
    enablePasswordReset? : boolean,
    enablePushNotificationTokens? : boolean,
    passwordResetSettings? : UserPasswordResetSettings,
    enableUserCreation? : boolean,
    enableProfileUpdate? : boolean,
    enablePasswordUpdate? : boolean,
    baseUrl? : string,
    pluginId? : string,
    createPasswordHashAndSaltMethod? : { (password : string) : Promise<{ hash: string; salt: string;} | null>  },
    validatePasswordMethod? : { (password : string, hash : string, salt : string) : Promise<boolean>  } 


 }

