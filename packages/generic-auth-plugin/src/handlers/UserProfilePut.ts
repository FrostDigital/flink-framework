
import { FlinkContext, Handler, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { UserProfile } from "../schemas/UserProfile";

export const putUserProfileHandler: Handler<  FlinkContext<genericAuthContext>, UserProfile, UserProfile  > = async ({ ctx, req }) => {

    

    let repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];

    let userId = req.user._id;
    let user = await repo.getBydId(userId);
    if(user == null){
        return notFound();
    }

    user.profile = req.body;
    await repo.updateOne(userId, { "profile" : req.body })

    user = await repo.getBydId(userId);

    return {
        data: user.profile
    };
};