import { FlinkContext, Handler, unauthorized } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { UserLoginReq } from "../schemas/UserLoginReq";
import { UserLoginRes } from "../schemas/UserLoginRes";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";

const userLoginHandler: Handler<
  FlinkContext<genericAuthContext>,
  UserLoginReq,
  UserLoginRes
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];
  
  const loginRespons = await ctx.plugins.genericAuthPlugin.loginUser(
    repo,
    <JwtAuthPlugin>ctx.auth,
    req.body.username,
    req.body.password,
    ctx.plugins.genericAuthPlugin.validatePasswordMethod,
    (<any>ctx.plugins)[pluginName].smsOptions,
    ctx.plugins.genericAuthPlugin.onSuccessfulLogin
  );

  if (loginRespons.status != "success") {
    switch (loginRespons.status) {
      case "failed":
        return unauthorized(
          "Invalid username or password",
          loginRespons.status
        );
    }
  }

  return {
    data: loginRespons,
    status: 200,
  };
};

export default userLoginHandler;
