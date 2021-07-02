
import { FlinkContext, Handler, internalServerError, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { UserPasswordChangeRes } from "../schemas/UserPasswordChangeRes";
import { UserPasswordChangeReq} from "../schemas/UserPasswordChangeReq";
import { emailPlugin, emailPluginContext} from "@flink-app/email-plugin";
import { UserPasswordResetStartReq } from "../schemas/UserPasswordResetStartReq";
import { UserPasswordResetStartResPublic } from "../schemas/UserPasswordResetStartResPublic";
import Handlebars from "handlebars";
export const postPasswordResetStartHandler: Handler<  FlinkContext<genericAuthContext&emailPluginContext>, UserPasswordResetStartReq, UserPasswordResetStartResPublic  > = async ({ ctx, req }) => {

    const repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];
    
    if(ctx.plugins.emailPlugin?.client == null){
        return internalServerError("Email plugin have to be initialized to use /password/reset");
    }

    if(ctx.plugins.genericAuthPlugin.passwordResetSettings == null){
        return internalServerError("Password reset settings is needed to use /password/reset")
    }
    
 

    const {jwtSecret, numberOfDigits, lifeTime} = ctx.plugins.genericAuthPlugin.passwordResetSettings.code

    const resp =  await ctx.plugins.genericAuthPlugin.passwordResetStart(repo, <JwtAuthPlugin>ctx.auth, jwtSecret, req.body.username, numberOfDigits, lifeTime );

    if(resp.status != "success"){
        return { data : { status : resp.status}}
    }

    const emailSettings = ctx.plugins.genericAuthPlugin.passwordResetSettings.email;

    const emailCtx = {
        code : resp.code,
        username : req.body.username,
        profile : resp.profile
    }

    const subject = Handlebars.compile(emailSettings.subject)(emailCtx);
    const html = Handlebars.compile(emailSettings.html)(emailCtx);
    const email = req.body.username;


    await ctx.plugins.emailPlugin.client.send({
        from : emailSettings.from_address,
        to : [email],
        subject, 
        html
    })
  
    return { data : { status : "success",  passwordResetToken : resp.passwordResetToken} };

};
