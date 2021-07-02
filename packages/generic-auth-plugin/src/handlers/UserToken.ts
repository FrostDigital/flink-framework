
import { FlinkContext, Handler, internalServerError, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { UserTokenRes } from "../schemas/UserTokenRes";


export const getUserTokenHandler: Handler<  FlinkContext<genericAuthContext>, UserTokenRes  > = async ({ ctx, req }) => {

    let repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];
    const user =  await repo.getBydId(req.user._id);
    if(user == null){
        return notFound("User not found");
    }
    if(ctx.auth == null){
        return internalServerError();
    }

    const token = await  ctx.auth.createToken({ username : user.username.toLowerCase(), _id : user._id}, user.roles);

    return { data : { token : token } };

};
