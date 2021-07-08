
import { badRequest, FlinkContext, Handler, internalServerError, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { UserPasswordChangeRes } from "../schemas/UserPasswordChangeRes";
import { UserPasswordChangeReq} from "../schemas/UserPasswordChangeReq";
import { emailPlugin, emailPluginContext} from "@flink-app/email-plugin";
import { UserPasswordResetCompleteReq } from "../schemas/UserPasswordResetCompleteReq";
import { UserPasswordResetCompleteRes } from "../schemas/UserPasswordResetCompleteRes";

export const postPasswordResetCompleteHandler: Handler<  FlinkContext<genericAuthContext&emailPluginContext>, UserPasswordResetCompleteReq, UserPasswordResetCompleteRes  > = async ({ ctx, req, origin }) => {

    let pluginName = origin || "genericAuthPlugin";
    let repo = ctx.repos[ (<any>ctx.plugins)[pluginName].repoName ];

    const emailPlguin = ctx.plugins.emailPlugin;
    if(emailPlugin == null){
        return internalServerError("Email plugin have to be initialized to use password-reset");
    }

    if(ctx.plugins.genericAuthPlugin.passwordResetSettings == null){
        return internalServerError("Password reset settings is needed to use password-reset")
    }
    

    const {jwtSecret, numberOfDigits, lifeTime} = ctx.plugins.genericAuthPlugin.passwordResetSettings.code

    const resp =  await ctx.plugins.genericAuthPlugin.passwordResetComplete(repo, <JwtAuthPlugin>ctx.auth, jwtSecret, req.body.passwordResetToken, req.body.code, req.body.password, ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod);

    switch(resp.status){
        case "invalidCode":
            return badRequest("Invalid validation code", resp.status);
        case "passwordError":
            return badRequest("Invalid password", resp.status);
        case "userNotFound":
            return notFound("User not found", resp.status);

    }
    return { data : resp, status : 200 };

};
