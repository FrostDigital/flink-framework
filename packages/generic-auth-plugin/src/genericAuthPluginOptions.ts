import { UserPasswordResetSettings } from "./schemas/UserPasswordResetSettings";

export interface genericAuthPluginOptions{
    repoName : string,  
    enableRoutes? : boolean,
    enablePasswordReset? : boolean,
    enablePushnotificationTokens : boolean,
    passwordResetSettings? : UserPasswordResetSettings
 }

