import { FlinkPlugin } from "@flink-app/flink";
import {
  loginUser,
  createUser,
  changePassword,
  passwordResetComplete,
  passwordResetStart,
} from "./coreFunctions";
import { init } from "./init";
import { GenericAuthPluginOptions } from "./genericAuthPluginOptions";

export * from "./genericAuthContext";
export * from "./coreFunctions";
export * from "./schemas/User";
export * from "./genericAuthPluginOptions";
export * from "./management";

export const genericAuthPlugin = (
  options: GenericAuthPluginOptions
): FlinkPlugin => {
  if (options.pluginId == null) options.pluginId = "genericAuthPlugin";
  return {
    id: options.pluginId,
    init: (app) => init(app, options),
    ctx: {
      loginUser,
      createUser,
      changePassword,
      passwordResetStart,
      passwordResetComplete,
      repoName: options.repoName,
      passwordResetSettings: options.passwordResetSettings,
      createPasswordHashAndSaltMethod: options.createPasswordHashAndSaltMethod,
      validatePasswordMethod: options.validatePasswordMethod,
      usernameFormat: options.usernameFormat || /.{1,}$/,
    },
  };
};
