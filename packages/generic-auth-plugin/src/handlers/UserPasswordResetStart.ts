import { emailPluginContext } from "@flink-app/email-plugin";
import { FlinkContext, Handler, internalServerError } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import Handlebars from "handlebars";
import { genericAuthContext } from "../genericAuthContext";
import { UserPasswordResetStartReq } from "../schemas/UserPasswordResetStartReq";
import { UserPasswordResetStartResPublic } from "../schemas/UserPasswordResetStartResPublic";

const postPasswordResetStartHandler: Handler<
  FlinkContext<genericAuthContext & emailPluginContext>,
  UserPasswordResetStartReq,
  UserPasswordResetStartResPublic
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  if (ctx.plugins.emailPlugin?.client == null) {
    return internalServerError(
      "Email plugin have to be initialized to use /password/reset"
    );
  }

  if (ctx.plugins.genericAuthPlugin.passwordResetSettings == null) {
    return internalServerError(
      "Password reset settings is needed to use /password/reset"
    );
  }

  const { jwtSecret, numberOfDigits, lifeTime } =
  (<any>ctx.plugins)[pluginName].passwordResetSettings.code;

   

  const resp = await ctx.plugins.genericAuthPlugin.passwordResetStart(
    repo,
    <JwtAuthPlugin>ctx.auth,
    jwtSecret,
    req.body.username,
    numberOfDigits,
    lifeTime
  );

  if (resp.status != "success") {
    return { data: { status: "success", passwordResetToken: resp.passwordResetToken } };
  }

  const emailSettings =
  (<any>ctx.plugins)[pluginName].passwordResetSettings.email;

  const emailCtx = {
    code: resp.code,
    passwordResetToken: resp.passwordResetToken,
    username: req.body.username,
    profile: resp.profile,
  };

  const subject = Handlebars.compile(emailSettings.subject)(emailCtx);
  const html = Handlebars.compile(emailSettings.html)(emailCtx);
  const email = req.body.username;

  await ctx.plugins.emailPlugin.client.send({
    from: emailSettings.from_address,
    to: [email],
    subject,
    html,
  });

  return {
    data: { status: "success", passwordResetToken: resp.passwordResetToken },
  };
};

export default postPasswordResetStartHandler;
