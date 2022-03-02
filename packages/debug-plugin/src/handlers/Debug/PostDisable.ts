import { Handler, HttpMethod, notFound, RouteProps, FlinkContext } from "@flink-app/flink";

import { PostDebugDisableReq } from "../../schemas/Debug/PostDisableReq";
import { PostDebugDisableRes } from "../../schemas/Debug/PostDisableRes";

const PostDebugEnable: Handler<FlinkContext, PostDebugDisableReq, PostDebugDisableRes> = async ({ ctx, req, origin }) => {
    ctx.plugins.debugPlugin.enabled = false;
    return {
        data: {},
        status: 200,
    };
};
export default PostDebugEnable;
