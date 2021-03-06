import { badRequest, FlinkContext, Handler } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { genericAuthContext } from "../genericAuthContext";
import { UserPasswordChangeReq } from "../schemas/UserPasswordChangeReq";
import { UserPasswordChangeRes } from "../schemas/UserPasswordChangeRes";

const putUserPasswordHandler: Handler<
  FlinkContext<genericAuthContext>,
  UserPasswordChangeReq,
  UserPasswordChangeRes
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];
  const resp = await ctx.plugins.genericAuthPlugin.changePassword(
    repo,
    <JwtAuthPlugin>ctx.auth,
    req.user._id,
    req.body.password,
    ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod
  );

  switch (resp.status) {
    case "failed":
      return badRequest(
        "Password could not be changed on this user",
        resp.status
      );
    case "passwordError":
      return badRequest("Invalid password", resp.status);
  }

  return { data: resp, status: 200 };
};

export default putUserPasswordHandler;
