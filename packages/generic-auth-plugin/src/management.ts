import {
  ManagementApiModule,
  ManagementApiType,
} from "@flink-app/management-api-plugin";
import { HttpMethod } from "@flink-app/flink";
import * as userCreateHandler from "./handlers/UserCreate";
import * as GetManagementUser from "./handlers/Management/GetUser";
import * as GetManagementUserByUserid from "./handlers/Management/GetUserByUserid";
import * as PutManagementUserPasswordByUserid from "./handlers/Management/PutUserPasswordByUserid";
import * as PutManagementUserProfileByUserid from "./handlers/Management/PutUserProfileByUserid";
import * as PutManagementUserUsernameByUserid from "./handlers/Management/PutUserUsernameByUserid";
import * as PutManagementUserRolesByUserid from "./handlers/Management/PutUserRolesByUserid";
import * as DeleteManagementUserByUserid from "./handlers/Management/DeleteUserByUserid";
import GetGetSchemaHandler from "./handlers/Management/GetSchema";
import * as PutUserProfileByUseridAppend from "./handlers/Management/PutUserProfileByUseridAppend";

export interface GetManagementModuleConfig {
  pluginId?: string;
  profileSchema?: any;
  ui: boolean;
  uiSettings?: {
    title: string;
    enableUserDelete?: boolean;
    enableUserCreate?: boolean;
    enableUserEdit?: boolean;
  };
}

export const GetManagementModule = (
  config: GetManagementModuleConfig
): ManagementApiModule => {
  if (config.pluginId == null) config.pluginId = "genericAuthPlugin";

  let endpoints: ManagementApiModule["endpoints"] = [];
  endpoints.push({
    routeProps: {
      path: "",
      method: HttpMethod.post,
      origin: config.pluginId || "genericAuthPlugin",
    },
    handler: userCreateHandler,
  });

  endpoints.push({
    routeProps: {
      path: "",
      method: HttpMethod.get,
      origin: config.pluginId || "genericAuthPlugin",
    },
    handler: GetManagementUser,
  });

  // TODO: This will not work :(
  // endpoints.push({
  //   routeProps: {
  //     path: "/profile/schema",
  //     method: HttpMethod.get,
  //     origin: config.pluginId || "genericAuthPlugin",
  //   },
  //   handler: GetGetSchemaHandler(config.profileSchema),
  // });

  endpoints.push({
    routeProps: {
      path: "/:userid",
      method: HttpMethod.get,
      origin: config.pluginId || "genericAuthPlugin",
    },

    handler: GetManagementUserByUserid,
  });

  endpoints.push({
    routeProps: {
      path: "/:userid",
      method: HttpMethod.delete,
      origin: config.pluginId || "genericAuthPlugin",
    },
    handler: DeleteManagementUserByUserid,
  });

  endpoints.push({
    routeProps: {
      path: "/password/:userid",
      method: HttpMethod.put,
      origin: config.pluginId || "genericAuthPlugin",
    },
    handler: PutManagementUserPasswordByUserid,
  });

  endpoints.push({
    routeProps: {
      path: "/username/:userid",
      method: HttpMethod.put,
      origin: config.pluginId || "genericAuthPlugin",
    },
    handler: PutManagementUserUsernameByUserid,
  });

  endpoints.push({
    routeProps: {
      path: "/profile/:userid",
      method: HttpMethod.put,
      origin: config.pluginId || "genericAuthPlugin",
    },
    handler: PutManagementUserProfileByUserid,
  });

  endpoints.push({
    routeProps: {
      path: "/profile/:userid/append",
      method: HttpMethod.put,
      origin: config.pluginId || "genericAuthPlugin",
    },
    handler: PutUserProfileByUseridAppend,
  });

  endpoints.push({
    routeProps: {
      path: "/roles/:userid",
      method: HttpMethod.put,
      origin: config.pluginId || "genericAuthPlugin",
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
  };

  return module;
};
