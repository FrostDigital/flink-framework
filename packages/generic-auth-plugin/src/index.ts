import {  FlinkPlugin } from "@flink-app/flink";
import { loginUser,  createUser, changePassword, passwordResetComplete, passwordResetStart } from "./coreFunctions";
import { init } from "./init";
import { genericAuthPluginOptions } from "./genericAuthPluginOptions";

export * from "./genericAuthContext";
export * from "./coreFunctions";
export * from "./schemas/User";
export * from "./genericAuthPluginOptions"

 export const genericAuthPlugin = (options: genericAuthPluginOptions): FlinkPlugin => {
     return {
       id: "genericAuthPlugin",
       init: (app) => init(app, options),
       ctx : {
         loginUser,
         createUser,
         changePassword,
         passwordResetStart,
         passwordResetComplete,
         repoName : options.repoName,
         passwordResetSettings : options.passwordResetSettings,
         createPasswordHashAndSaltMethod : options.createPasswordHashAndSaltMethod,
         validatePasswordMethod : options.validatePasswordMethod
       }
     };
 };
  