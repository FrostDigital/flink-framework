import { ManagementApiModule, ManagementApiType } from "@flink-app/management-api-plugin";
import { HttpMethod } from "@flink-app/flink";
import * as postHandler from "./handlers/PostById";
import * as getHandler from "./handlers/Get";
import { Action } from "./schemas/Action";

export interface GetManagementModuleConfig {
    pluginId?: string;
    ui: boolean;
    uiSettings?: {
        title: string;
    };
    actions: Action[];
}

export const GetManagementModule = (config: GetManagementModuleConfig): ManagementApiModule => {
    if (config.pluginId == null) config.pluginId = "managementActionsApi";

    let endpoints: ManagementApiModule["endpoints"] = [];
    endpoints.push({
        routeProps: {
            path: "/:actionId",
            method: HttpMethod.post,
            origin: config.pluginId,
        },
        handler: postHandler,
    });

    endpoints.push({
        routeProps: {
            path: "",
            method: HttpMethod.get,
            origin: config.pluginId,
        },
        handler: getHandler,
    });

    let features: string[] = [];

    let module: ManagementApiModule = {
        id: config.pluginId || "action",
        uiSettings: {
            title: config.uiSettings?.title || "Actions",
            icon: "",
            features,
        },
        ui: config.ui,
        type: ManagementApiType.action,
        endpoints: endpoints,
        data: {
            actions: config.actions,
        },
    };

    return module;
};
