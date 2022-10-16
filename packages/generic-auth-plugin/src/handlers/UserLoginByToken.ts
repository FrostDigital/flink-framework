import { FlinkContext, Handler, unauthorized } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { genericAuthContext } from "../genericAuthContext";
import { UserLoginByTokenReq } from "../schemas/UserLoginByTokenReq";
import { UserLoginRes } from "../schemas/UserLoginRes";

const userLoginHandler: Handler<
  FlinkContext<genericAuthContext>,
  UserLoginByTokenReq,
  UserLoginRes
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];
  
  const loginRespons = await ctx.plugins.genericAuthPlugin.loginByToken(
    repo,
    <JwtAuthPlugin>ctx.auth,
    req.body.token,
    req.body.code,
    (<any>ctx.plugins)[pluginName].smsOptions.jwtToken
  );

  if (loginRespons.status != "success") {
    switch (loginRespons.status) {
      case "failed":
        return unauthorized(
          "Invalid token or code",
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
