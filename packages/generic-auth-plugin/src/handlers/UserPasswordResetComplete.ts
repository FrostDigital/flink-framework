
import { FlinkContext, Handler, internalServerError, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { UserPasswordChangeRes } from "../schemas/UserPasswordChangeRes";
import { UserPasswordChangeReq} from "../schemas/UserPasswordChangeReq";
import { emailPlugin, emailPluginContext} from "@flink-app/email-plugin";
import { UserPasswordResetCompleteReq } from "../schemas/UserPasswordResetCompleteReq";
import { UserPasswordResetCompleteRes } from "../schemas/UserPasswordResetCompleteRes";

export const postPasswordResetCompleteHandler: Handler<  FlinkContext<genericAuthContext&emailPluginContext>, UserPasswordResetCompleteReq, UserPasswordResetCompleteRes  > = async ({ ctx, req }) => {

    const repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];
    const emailPlguin = ctx.plugins.emailPlugin;
    if(emailPlugin == null){
        return internalServerError("Email plugin have to be initialized to use password-reset");
    }

    if(ctx.plugins.genericAuthPlugin.passwordResetSettings == null){
        return internalServerError("Password reset settings is needed to use password-reset")
    }
    

    const {jwtSecret, numberOfDigits, lifeTime} = ctx.plugins.genericAuthPlugin.passwordResetSettings.code

    const resp =  await ctx.plugins.genericAuthPlugin.passwordResetComplete(repo, <JwtAuthPlugin>ctx.auth, jwtSecret, req.body.passwordResetToken, req.body.code, req.body.password, ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod);

    const statusCode = resp.status == "success" ? 200 : 422;

    return { data : resp, status : statusCode };

};
