import { Handler, HttpMethod, notFound, RouteProps, FlinkContext } from "@flink-app/flink";

import { PostDebugEnableReq } from "../../schemas/Debug/PostEnableReq";
import { PostDebugEnableRes } from "../../schemas/Debug/PostEnableRes";

const PostDebugEnable: Handler<FlinkContext, PostDebugEnableReq, PostDebugEnableRes> = async ({ ctx, req, origin }) => {
    ctx.plugins.debugPlugin.enabled = true;
    return {
        data: {},
        status: 200,
    };
};
export default PostDebugEnable;
