
import { FlinkContext, Handler, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { UserProfile } from "../schemas/UserProfile";

export const getProfileHandler: Handler<  FlinkContext<genericAuthContext>, UserProfile  > = async ({ ctx, req }) => {

    

    let repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];

    let userId = req.user._id;
    let user = await repo.getBydId(userId);
    if(user == null){
        return notFound();
    }
    

    return {
        data: user.profile
    };
};
