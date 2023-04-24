import { FlinkContext, Handler } from "@flink-app/flink";

import { ManagementGetRequest, ManagementGetResponse } from "../schemas/ManagementGet";
import { MessagingData, MessagingSegment, MessagingSegmentView } from "../schemas/ManagementModule";

const getManagementPluginHandler: Handler<FlinkContext, ManagementGetRequest, ManagementGetResponse> = async ({ ctx, req, origin }) => {
    const modules = ctx.plugins.managementApi.moduleList.modules as any[];
    const module = modules.find((p) => p.id == origin);

    const segments = module.data?.segments as MessagingSegment[];
    const messageingData = (module.data?.data as MessagingData[] | undefined) || [];

    const data = {
        segments: segments.map((s) => {
            let sv: MessagingSegmentView = {
                id: s.id,
                description: s.description,
            };
            return sv;
        }),
        data: messageingData,
    };

    return {
        data,
        status: 200,
    };
};

export default getManagementPluginHandler;
