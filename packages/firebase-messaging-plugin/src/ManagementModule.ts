import { HttpMethod } from "@flink-app/flink";
import { ManagementApiModule, ManagementApiType } from "@flink-app/management-api-plugin";
import * as getManagementPluginHandler from "./managementHandlers/Get";
import * as postMessageHandler from "./managementHandlers/PostMessage";
import { GetManagementModuleConfig } from "./schemas/ManagementModule";

export const GetManagementModule = (config: GetManagementModuleConfig): ManagementApiModule => {
    if (config.pluginId == null) config.pluginId = "managementNotificationsApi";

    let endpoints: ManagementApiModule["endpoints"] = [];

    endpoints.push({
        routeProps: {
            path: "",
            method: HttpMethod.get,
            origin: config.pluginId,
        },
        handler: getManagementPluginHandler,
    });

    endpoints.push({
        routeProps: {
            path: "/message",
            method: HttpMethod.post,
            origin: config.pluginId,
        },
        handler: postMessageHandler,
    });

    let features: string[] = [];

    let module: ManagementApiModule = {
        id: config.pluginId || "notifications",
        uiSettings: {
            title: config.uiSettings?.title || "Notifications",
            icon: "",
            features,
        },
        ui: config.ui,
        type: ManagementApiType.notification,
        endpoints: endpoints,
        data: {
            segments: config.segments,
            data: config.data,
            callback: config.messageSentCallback,
        },
    };

    return module;
};
