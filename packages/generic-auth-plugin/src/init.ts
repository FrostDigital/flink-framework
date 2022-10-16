import { FlinkApp, HttpMethod } from "@flink-app/flink";
import * as userLoginHandler from "./handlers/UserLogin";
import * as userLoginByTokenHandler from "./handlers/UserLoginByToken";
import * as userCreateHandler from "./handlers/UserCreate";
import * as getProfileHandler from "./handlers/UserProfileGet";
import * as putUserProfileHandler from "./handlers/UserProfilePut";
import * as putUserPasswordHandler from "./handlers/UserPasswordPut";
import * as postPasswordResetStartHandler from "./handlers/UserPasswordResetStart";
import * as postPasswordResetCompleteHandler from "./handlers/UserPasswordResetComplete";
import { GenericAuthPluginOptions } from "./genericAuthPluginOptions";
import * as postUserPushRegisterTokenHandler from "./handlers/UserPushRegisterToken";
import * as postUserRemoveTokenHandler from "./handlers/UserPushRemoveToken";
import * as getUserTokenHandler from "./handlers/UserToken";
import { handleUserPasswordResetForm } from "./handlers/UserPasswordResetForm";

export function init(app: FlinkApp<any>, options: GenericAuthPluginOptions) {
  if (options.enableUserCreation == null) options.enableUserCreation = true;
  if (options.enableProfileUpdate == null) options.enableProfileUpdate = true;
  if (options.enablePasswordUpdate == null) options.enablePasswordUpdate = true;
  if (options.baseUrl == null) options.baseUrl = "/user";

  if (options.enableRoutes) {
    app.addHandler(userLoginHandler, {
      method: HttpMethod.post,
      path: options.baseUrl + "/login",
      docs: "Authenticates a user",
      origin: options.pluginId,
    });
    if(options.sms){
      app.addHandler(userLoginByTokenHandler, {
        method: HttpMethod.post,
        path: options.baseUrl + "/login-by-token",
        docs: "Authenticates a user by token",
        origin: options.pluginId,
      });
    }
    if (options.enableUserCreation) {
      app.addHandler(userCreateHandler, {
        method: HttpMethod.post,
        path: options.baseUrl + "/create",
        docs: "Creates a new user",
        origin: options.pluginId,
      });
    }

    app.addHandler(getProfileHandler, {
      method: HttpMethod.get,
      path: options.baseUrl + "/profile",
      docs: "Gets the user profile",
      permissions: "authenticated",
      origin: options.pluginId,
    });

    app.addHandler(getUserTokenHandler, {
      method: HttpMethod.get,
      path: options.baseUrl + "/token",
      docs: "Gets a refreshed token for the user",
      permissions: "authenticated",
      origin: options.pluginId,
    });

    if (options.enableProfileUpdate) {
      app.addHandler(putUserProfileHandler, {
        method: HttpMethod.put,
        path: options.baseUrl + "/profile",
        docs: "Updates the user profile",
        permissions: "authenticated",
        origin: options.pluginId,
      });
    }

    if (options.enablePasswordUpdate) {
      app.addHandler(putUserPasswordHandler, {
        method: HttpMethod.put,
        path: options.baseUrl + "/password",
        docs: "Updates the user password",
        permissions: "authenticated",
        origin: options.pluginId,
      });
    }

    if (options.enablePasswordReset) {
      app.addHandler(postPasswordResetStartHandler, {
        method: HttpMethod.post,
        path: options.baseUrl + "/password/reset",
        docs: "Start the password reset process for a user",
        origin: options.pluginId,
      });

      app.addHandler(postPasswordResetCompleteHandler, {
        method: HttpMethod.post,
        path: options.baseUrl + "/password/reset/complete",
        docs: "Completes a password reset for a user",
        origin: options.pluginId,
      });

      if (options.passwordResetSettings?.enablePasswordResetForm) {
        app.expressApp?.get(
          options.baseUrl + "/password/reset/form",
          (req, res) =>
            handleUserPasswordResetForm(req, res, {
              templateFile: options.passwordResetSettings?.passwordResetForm,
              completeUrl: options.baseUrl + "/password/reset/complete",
            })
        );
      }
    }

    if (options.enablePushNotificationTokens) {
      app.addHandler(postUserPushRegisterTokenHandler, {
        method: HttpMethod.post,
        path: options.baseUrl + "/push",
        docs: "Register a push notification on current user",
        permissions: "authenticated",
        origin: options.pluginId,
      });

      app.addHandler(postUserRemoveTokenHandler, {
        method: HttpMethod.delete,
        path: options.baseUrl + "/push",
        docs: "Removes a push notification token from current user",
        permissions: "authenticated",
        origin: options.pluginId,
      });
    }
  }
}

export {};
