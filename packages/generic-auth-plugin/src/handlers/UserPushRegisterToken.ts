import { FlinkContext, Handler, log, notFound } from "@flink-app/flink";
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
    const allowMultipleDevices = pluginOptions.allowMultipleDevices ?? true;

    const user = <User>await repo.getById(req.user._id);

    if (user == null) {
        return notFound("User not found");
    }

    let exToken = user.pushNotificationTokens.find((t) => t.deviceId == req.body.deviceId);

    if (exToken != null) {
        exToken.token = req.body.token;
    } else {
        user.pushNotificationTokens.push({ ...req.body, type: req.body.type || "firebase" });
    }

    if (!allowMultipleDevices) {
        // Filter out all other devices except the newly registered one
        user.pushNotificationTokens = user.pushNotificationTokens.filter((t) => t.deviceId === req.body.deviceId);
    }

    await repo.updateOne(user._id, {
        pushNotificationTokens: user.pushNotificationTokens,
    });

    if (deregisterOtherDevices) {
        const otherRegistrations = <User[]>await repo.findAll({
            $or: [{ "pushNotificationTokens.deviceId": req.body.deviceId }, { "pushNotificationTokens.token": req.body.token }],
            _id: { $ne: user._id },
        });

        log.debug(`Found ${otherRegistrations.length} other registrations for device ${req.body.deviceId} or token ${req.body.token}`);

        for (let other of otherRegistrations) {
            try {
                let lengthBefore = other.pushNotificationTokens.length;

                other.pushNotificationTokens = other.pushNotificationTokens.filter((t) => t.deviceId !== req.body.deviceId && t.token !== req.body.token);

                log.debug(
                    `Deregistering ${lengthBefore - other.pushNotificationTokens.length} devices for user ${other._id} as other user ${
                        user._id
                    } claimed this device`
                );

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
