import { badRequest, conflict, FlinkContext, Handler, internalServerError } from "@flink-app/flink";
import { Action, ActionView } from "../schemas/Action";
import { ActionReturnStatus } from "../schemas/Action";
const getHandler: Handler<FlinkContext, any, ActionView[]> = async ({ ctx, req, origin }) => {
    const modules = ctx.plugins.managementApi.moduleList.modules as any[];
    const module = modules.find((p) => p.id == origin);

    if (module.data?.actions == null) {
        return {
            data: [],
            status: 200,
        };
    }

    const actions = module.data?.actions as Action[];

    const data = actions.map((a) => {
        let av: ActionView = {
            id: a.id,
            description: a.description,
            arguments: a.arguments,
        };
        return av;
    });

    return {
        data,
        status: 200,
    };
};

export default getHandler;
