
import { FlinkContext, Handler, internalServerError, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { UserPasswordChangeRes } from "../schemas/UserPasswordChangeRes";
import { UserPasswordChangeReq} from "../schemas/UserPasswordChangeReq";


export const putUserPasswordHandler: Handler<  FlinkContext<genericAuthContext>, UserPasswordChangeReq, UserPasswordChangeRes  > = async ({ ctx, req }) => {

    let repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];
    const resp =  await ctx.plugins.genericAuthPlugin.changePassword(repo, <JwtAuthPlugin>ctx.auth, req.user._id, req.body.password, ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod );


    
    const statusCode = resp.status == "success" ? 200 : 422;
    return { data : resp, status : statusCode};

};
