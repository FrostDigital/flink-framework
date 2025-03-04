import {
  badRequest,
  FlinkContext,
  Handler,
  internalServerError,
  notFound,
} from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { genericAuthContext } from "../genericAuthContext";
import { UserPasswordResetCompleteReq } from "../schemas/UserPasswordResetCompleteReq";
import { UserPasswordResetCompleteRes } from "../schemas/UserPasswordResetCompleteRes";

const postPasswordResetCompleteHandler: Handler<
  FlinkContext<genericAuthContext>,
  UserPasswordResetCompleteReq,
  UserPasswordResetCompleteRes
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  if (ctx.plugins.genericAuthPlugin.passwordResetSettings == null) {
    return internalServerError(
      "Password reset settings is needed to use password-reset"
    );
  }

  const { jwtSecret /*, numberOfDigits, lifeTime*/ } =
  (<any>ctx.plugins)[pluginName].passwordResetSettings.code;

  const resp = await ctx.plugins.genericAuthPlugin.passwordResetComplete(
    repo,
    <JwtAuthPlugin>ctx.auth,
    jwtSecret,
    req.body.passwordResetToken,
    req.body.code,
    req.body.password,
    ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod,
    ctx.plugins.genericAuthPlugin.passwordResetSettings.passwordResetReusableTokens
  );

  switch (resp.status) {
    case "invalidCode":
      return badRequest("Invalid validation code", resp.status);
    case "passwordError":
      return badRequest("Invalid password", resp.status);
    case "userNotFound":
      return notFound("User not found", resp.status);
  }
  return { data: resp, status: 200 };
};

export default postPasswordResetCompleteHandler;
