import {
  ManagementApiModule,
  ManagementApiType,
} from "@flink-app/management-api-plugin";
import { HttpMethod } from "@flink-app/flink";
import { userCreateHandler } from "./handlers/UserCreate";
import GetManagementUser from "./handlers/Management/GetUser";
import GetManagementUserByUserid from "./handlers/Management/GetUserByUserid";
import PutManagementUserPasswordByUserid from "./handlers/Management/PutUserPasswordByUserid";
import PutManagementUserProfileByUserid from "./handlers/Management/PutUserProfileByUserid";
import PutManagementUserUsernameByUserid from "./handlers/Management/PutUserUsernameByUserid";
import PutManagementUserRolesByUserid from "./handlers/Management/PutUserRolesByUserid";
import DeleteManagementUserByUserid from "./handlers/Management/DeleteUserByUserid";
import GetGetSchemaHandler from "./handlers/Management/GetSchema";
import PutUserProfileByUseridAppend from "./handlers/Management/PutUserProfileByUseridAppend";

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

  let endpoints = [];
  endpoints.push({
    config: {
      routeProps: {
        path: "",
        method: HttpMethod.post,
        // schema: {
        //   reqSchema: schemas.UserCreateReq,
        //   resSchema: schemas.UserCreateRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: userCreateHandler,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "",
        method: HttpMethod.get,
        // schema: {
        //   reqSchema: schemas.GetManagementUserReq,
        //   resSchema: schemas.GetManagementUserRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: GetManagementUser,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/profile/schema",
        method: HttpMethod.get,
        // schema: {
        //   reqSchema: schemas.PutManagementUserRolesByUseridReq,
        //   resSchema: schemas.PutManagementUserRolesByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: GetGetSchemaHandler(config.profileSchema),
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/:userid",
        method: HttpMethod.get,
        // schema: {
        //   reqSchema: schemas.GetManagementUserByUseridReq,
        //   resSchema: schemas.GetManagementUserByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: GetManagementUserByUserid,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/:userid",
        method: HttpMethod.delete,
        // schema: {
        //   reqSchema: schemas.DeleteManagementUserByUseridReq,
        //   resSchema: schemas.DeleteManagementUserByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: DeleteManagementUserByUserid,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/password/:userid",
        method: HttpMethod.put,
        // schema: {
        //   reqSchema: schemas.PutManagementUserPasswordByUseridReq,
        //   resSchema: schemas.PutManagementUserPasswordByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: PutManagementUserPasswordByUserid,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/username/:userid",
        method: HttpMethod.put,
        // schema: {
        //   reqSchema: schemas.PutManagementUserUsernameByUseridReq,
        //   resSchema: schemas.PutManagementUserPasswordByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: PutManagementUserUsernameByUserid,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/profile/:userid",
        method: HttpMethod.put,
        // schema: {
        //   reqSchema: schemas.PutManagementUserProfileByUseridReq,
        //   resSchema: schemas.PutManagementUserProfileByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: PutManagementUserProfileByUserid,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/profile/:userid/append",
        method: HttpMethod.put,
        // schema: {
        //   reqSchema: schemas.PutManagementUserProfileByUseridReq,
        //   resSchema: schemas.PutManagementUserProfileByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: PutUserProfileByUseridAppend,
  });

  endpoints.push({
    config: {
      routeProps: {
        path: "/roles/:userid",
        method: HttpMethod.put,
        // schema: {
        //   reqSchema: schemas.PutManagementUserRolesByUseridReq,
        //   resSchema: schemas.PutManagementUserRolesByUseridRes,
        // },
        origin: config.pluginId || "genericAuthPlugin",
      },
    },
    handlerFn: PutManagementUserRolesByUserid,
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
      features,
    },
    ui: config.ui,
    type: ManagementApiType.user,
    endpoints: endpoints,
  };

  return module;
};
