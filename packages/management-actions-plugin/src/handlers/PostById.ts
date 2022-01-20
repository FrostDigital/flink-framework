import { badRequest, conflict, FlinkContext, Handler, internalServerError, notFound } from "@flink-app/flink";
import { Action, ActionArgumentsValues, ActionResponse, ActionReturnStatus } from "../schemas/Action";

const postHandler: Handler<FlinkContext, ActionArgumentsValues, ActionResponse> = async ({ ctx, req, origin }) => {
    const modules = ctx.plugins.managementApi.moduleList.modules as any[];
    const module = modules.find((p) => p.id == origin);

    if (module.data?.actions == null) {
        return notFound("Action not found");
    }

    const actions = module.data!.actions as Action[];
    let action = actions.find((a) => a.id == req.params.actionId);
    if (action == null) {
        return notFound("Action not found");
    }

    for (let i in action.arguments) {
        let arg = action.arguments[i];
        if (arg.required) {
            if (req.body[arg.id] == null) {
                return badRequest(`${arg.id} is missing `);
            }
        }
    }

    try {
        const resp = await action.handler(ctx, req.body);
        if (resp.status == ActionReturnStatus.success) {
            return {
                data: resp,
                status: 200,
            };
        } else {
            return internalServerError(resp.error);
        }
    } catch (ex) {
        console.log("EXCEPTIOIN managementActionsPlugin:");
        console.log(ex);
        return internalServerError();
    }
};

export default postHandler;
