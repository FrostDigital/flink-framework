import { ManagementApiModule, ManagementApiType } from "@flink-app/management-api-plugin";
import { HttpMethod } from "@flink-app/flink";
import * as userCreateHandler from "./handlers/UserCreate";
import * as GetManagementUser from "./handlers/Management/GetUser";
import * as GetManagementUserByUserid from "./handlers/Management/GetUserByUserid";
import * as PutManagementUserPasswordByUserid from "./handlers/Management/PutUserPasswordByUserid";
import * as PutManagementUserProfileByUserid from "./handlers/Management/PutUserProfileByUserid";
import * as PutManagementUserUsernameByUserid from "./handlers/Management/PutUserUsernameByUserid";
import * as PutManagementUserRolesByUserid from "./handlers/Management/PutUserRolesByUserid";
import * as DeleteManagementUserByUserid from "./handlers/Management/DeleteUserByUserid";
import * as GetUserViewByUserid from "./handlers/Management/GetUserViewByUserid";

import * as PutUserProfileByUseridAppend from "./handlers/Management/PutUserProfileByUseridAppend";
import * as GetSchema from "./handlers/Management/GetSchema";
import { User } from ".";
import { GetManagementUserViewByUseridRes } from "./schemas/Management/GetUserViewByUseridRes";

export interface GetManagementModuleConfig {
    pluginId?: string;
    profileSchema?: any;
    ui: boolean;
    userView?: {
        getData(user: User): GetManagementUserViewByUseridRes;
    };
    uiSettings?: {
        title: string;
        enableUserDelete?: boolean;
        enableUserCreate?: boolean;
        enableUserEdit?: boolean;
        enableUserView?: boolean;
    };
}

export const GetManagementModule = (config: GetManagementModuleConfig): ManagementApiModule => {
    if (config.pluginId == null) config.pluginId = "genericAuthPlugin";

    let endpoints: ManagementApiModule["endpoints"] = [];
    endpoints.push({
        routeProps: {
            path: "",
            method: HttpMethod.post,
            origin: config.pluginId,
        },
        handler: userCreateHandler,
    });

    endpoints.push({
        routeProps: {
            path: "",
            method: HttpMethod.get,
            origin: config.pluginId,
        },
        handler: GetManagementUser,
    });

    endpoints.push({
        routeProps: {
            path: "/profile/schema",
            method: HttpMethod.get,
            origin: config.pluginId || "genericAuthPlugin",
        },
        handler: GetSchema,
    });

    endpoints.push({
        routeProps: {
            path: "/:userid",
            method: HttpMethod.get,
            origin: config.pluginId,
        },

        handler: GetManagementUserByUserid,
    });

    endpoints.push({
        routeProps: {
            path: "/:userid/view",
            method: HttpMethod.get,
            origin: config.pluginId,
        },

        handler: GetUserViewByUserid,
    });

    endpoints.push({
        routeProps: {
            path: "/:userid",
            method: HttpMethod.delete,
            origin: config.pluginId,
        },
        handler: DeleteManagementUserByUserid,
    });

    endpoints.push({
        routeProps: {
            path: "/password/:userid",
            method: HttpMethod.put,
            origin: config.pluginId,
        },
        handler: PutManagementUserPasswordByUserid,
    });

    endpoints.push({
        routeProps: {
            path: "/username/:userid",
            method: HttpMethod.put,
            origin: config.pluginId,
        },
        handler: PutManagementUserUsernameByUserid,
    });

    endpoints.push({
        routeProps: {
            path: "/profile/:userid",
            method: HttpMethod.put,
            origin: config.pluginId,
        },
        handler: PutManagementUserProfileByUserid,
    });

    endpoints.push({
        routeProps: {
            path: "/profile/:userid/append",
            method: HttpMethod.put,
            origin: config.pluginId,
        },
        handler: PutUserProfileByUseridAppend,
    });

    endpoints.push({
        routeProps: {
            path: "/roles/:userid",
            method: HttpMethod.put,
            origin: config.pluginId,
        },
        handler: PutManagementUserRolesByUserid,
    });

    let features: string[] = [];

    if (config.uiSettings?.enableUserDelete == true) {
        features.push("delete");
    }
    if (config.uiSettings?.enableUserCreate == true) {
        features.push("create");
    }
    if (config.uiSettings?.enableUserEdit == true) {
        features.push("edit");
    }
    if (config.uiSettings?.enableUserView == true) {
        features.push("view");
    }

    let module: ManagementApiModule = {
        id: config.pluginId || "user",
        uiSettings: {
            title: config.uiSettings?.title || "Users",
            icon: "",
            features,
        },
        ui: config.ui,
        type: ManagementApiType.user,
        endpoints: endpoints,
        data: {
            profileSchema: config.profileSchema,
            userViewGetData: config.userView?.getData,
        },
    };

    return module;
};
