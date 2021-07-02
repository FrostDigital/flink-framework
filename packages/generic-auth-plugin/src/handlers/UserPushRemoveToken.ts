
import { FlinkContext, Handler, internalServerError, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { PushNotificationToken } from "../schemas/PushNotificationToken";
import { PushNotificatioNTokenRes } from "../schemas/PushNotificationTokenRes";
import { User } from "../schemas/User";

export const postUserRemoveTokenHandler : Handler<  FlinkContext<genericAuthContext>, PushNotificationToken,  PushNotificatioNTokenRes > = async ({ ctx, req }) => {

    const repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];
    
    const user = <User>await repo.getBydId(req.user._id);
    
    if(user == null){
        return notFound("User not found");
    }

    user.pushNotificationTokens = user.pushNotificationTokens.filter( (t) => t.deviceId != req.body.deviceId);

    await repo.updateOne(user._id, { pushNotificationTokens : user.pushNotificationTokens});

    return { data : { status : "success"  }};

};
