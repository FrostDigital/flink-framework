
import { FlinkContext, Handler } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { UserLoginReq } from "../schemas/UserLoginReq";
import { UserLoginRes } from "../schemas/UserLoginRes";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";

export const userLoginHandler: Handler<  FlinkContext<genericAuthContext>, UserLoginReq, UserLoginRes  > = async ({ ctx, req }) => {

    let repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];
    const loginRespons = await ctx.plugins.genericAuthPlugin.loginUser(repo, <JwtAuthPlugin>ctx.auth, req.body.username, req.body.password, ctx.plugins.genericAuthPlugin.validatePasswordMethod);

    return {
        data: loginRespons
    };
};
