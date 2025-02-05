import { FlinkPlugin } from "@flink-app/flink";
import { loginUser, createUser, changePassword, passwordResetComplete, passwordResetStart, loginByToken } from "./coreFunctions";
import { init } from "./init";
import { GenericAuthPluginOptions } from "./genericAuthPluginOptions";

export * from "./genericAuthContext";
export * from "./coreFunctions";
export * from "./schemas/User";
export * from "./genericAuthPluginOptions";
export * from "./management";

export const genericAuthPlugin = (options: GenericAuthPluginOptions): FlinkPlugin => {
    if (options.pluginId == null) options.pluginId = "genericAuthPlugin";

    const { sms, usernameFormat, ...restOptions } = options;

    return {
        id: options.pluginId,
        init: (app) => init(app, options),
        ctx: {
            ...restOptions,
            loginUser,
            loginByToken,
            createUser,
            changePassword,
            passwordResetStart,
            passwordResetComplete,
            usernameFormat: usernameFormat || /.{1,}$/,
            smsOptions: sms,
        },
    };
};
