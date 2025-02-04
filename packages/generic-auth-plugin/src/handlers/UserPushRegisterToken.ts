import { FlinkContext, Handler, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { PushNotificationToken } from "../schemas/PushNotificationToken";
import { PushNotificatioNTokenRes } from "../schemas/PushNotificationTokenRes";
import { User } from "../schemas/User";
import { GenericAuthPluginOptions } from "../genericAuthPluginOptions";

const postUserPushRegisterTokenHandler: Handler<FlinkContext<genericAuthContext>, PushNotificationToken, PushNotificatioNTokenRes> = async ({
    ctx,
    req,
    origin,
}) => {
    const pluginName = origin || "genericAuthPlugin";
    const pluginOptions: GenericAuthPluginOptions = (ctx.plugins as any)[pluginName];
    const repo = ctx.repos[pluginOptions.repoName];
    const deregisterOtherDevices = pluginOptions.deregisterOtherDevices || false;

    const user = <User>await repo.getById(req.user._id);

    if (user == null) {
        return notFound("User not found");
    }

    let exToken = user.pushNotificationTokens.find((t) => t.deviceId == req.body.deviceId);

    if (exToken != null) {
        exToken.token = req.body.token;
    } else {
        user.pushNotificationTokens.push(req.body);
    }

    await repo.updateOne(user._id, {
        pushNotificationTokens: user.pushNotificationTokens,
    });

    if (deregisterOtherDevices) {
        const otherRegistrations = <User[]>await repo.findAll({
            $or: [{ "pushNotificationTokens.deviceId": req.body.deviceId }, { "pushNotificationTokens.token": req.body.token }],
            _id: { $ne: user._id },
        });

        for (let other of otherRegistrations) {
            try {
                other.pushNotificationTokens = other.pushNotificationTokens.filter((t) => t.deviceId != req.body.deviceId || t.token != req.body.token);
                await repo.updateOne(other._id, {
                    pushNotificationTokens: other.pushNotificationTokens,
                });
            } catch (e) {
                console.error("Error deregistering other devices", e);
            }
        }
    }

    return { data: { status: "success" } };
};

export default postUserPushRegisterTokenHandler;
