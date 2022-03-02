import { Handler, HttpMethod, notFound, RouteProps, FlinkContext } from "@flink-app/flink";
import request from "../../models/request";

import { GetReq } from "../../schemas/Debug/GetReq";
import { GetRes } from "../../schemas/Debug/GetRes";

const Get: Handler<FlinkContext, GetReq, GetRes> = async ({ ctx, req, origin }) => {
    let enabled = ctx.plugins.debugPlugin.enabled as boolean;
    let requests = ctx.plugins.debugPlugin.requests as request[];

    return {
        data: {
            requests,
            enabled,
        },
        status: 200,
    };
};
export default Get;
