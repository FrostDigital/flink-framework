import { FlinkContext, Handler } from "@flink-app/flink";

import { MessagingSegment, MessagingTarget } from "../schemas/ManagementModule";
import { ManagementPostMessageRequest, ManagementPostMessageResponse } from "../schemas/ManagementPostMessage";
import Message from "../schemas/Message";

const postMessageHandler: Handler<FlinkContext, ManagementPostMessageRequest, ManagementPostMessageResponse> = async ({ ctx, req, origin }) => {
    const modules = ctx.plugins.managementApi.moduleList.modules as any[];
    const module = modules.find((p) => p.id == origin);

    let segment = module?.data?.segments?.find((p: any) => p.id === req.body.segment) as MessagingSegment;
    if (!segment) {
        return {
            data: { message: "Segment not found" },
            status: 500,
        };
    }

    let targets = await segment.handler(ctx);

    let tokens = targets.map((t) => t.pushToken).flat();

    let message: Message = {
        to: tokens,
        notification: {
            title: req.body.subject,
            body: req.body.body,
        },
        data: req.body.data,
    };

    await ctx.plugins["firebaseMessaging"].send(message);

    let callback = module?.data?.callback as (ctx: FlinkContext, target: MessagingTarget[], message: Message) => void;
    if (callback) {
        callback(ctx, targets, message);
    }

    return {
        data: {},
        status: 200,
    };
};

export default postMessageHandler;
