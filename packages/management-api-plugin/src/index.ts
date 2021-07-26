import {
  FlinkApp,
  FlinkPlugin,
  HttpMethod,
  JSONSchema,
  unauthorized,
} from "@flink-app/flink";
import jsonwebtoken from "jsonwebtoken";
import schemas from "../.flink/generated-schemas.json";
import GetManagement from "./handlers/Management/Get";
import DeleteUserById from "./handlers/User/DeleteByUserid";
import GetUserByUserid from "./handlers/User/GetByUserid";
import GetUserList from "./handlers/User/GetList";
import PostUser from "./handlers/User/Post";
import PostUserLogin from "./handlers/User/PostLogin";
import PutUserById from "./handlers/User/PutByUserid";
import {
  ManagementApiModule,
  ManagementApiOptions,
  ManagementApiType,
} from "./models/ManagementApi";
import managementuserRepo from "./repos/ManagementUserRepo";
import { Module, ModuleList } from "./schemas/ModuleList";

export * from "./models/ManagementApi";

export const managementApiPlugin = (
  options: ManagementApiOptions
): FlinkPlugin => {
  let managementApiModule: ManagementApiModule = {
    id: "managementapiuser",
    type: ManagementApiType.managementUser,
    ui: true,
    uiSettings: {
      title: "Admin users",
      icon: "",
    },
    endpoints: [],
  };

  managementApiModule.endpoints.push({
    config: {
      routeProps: {
        method: HttpMethod.get,
        path: "",
        docs: "List all management users",
      },
      schema: {
        reqSchema: schemas.definitions.GetUserListReq as JSONSchema,
        resSchema: schemas.definitions.GetUserListRes as JSONSchema,
      },
    },
    handlerFn: GetUserList,
  });

  managementApiModule.endpoints.push({
    config: {
      routeProps: {
        method: HttpMethod.get,
        path: "/:userid",
        docs: "Get one mangement user by id",
      },
      schema: {
        reqSchema: schemas.definitions.GetUserByUseridReq as JSONSchema,
        resSchema: schemas.definitions.GetUserByUseridRes as JSONSchema,
      },
    },
    handlerFn: GetUserByUserid,
  });

  managementApiModule.endpoints.push({
    config: {
      routeProps: {
        method: HttpMethod.post,
        path: "",
        docs: "Create a new management user",
      },
      schema: {
        reqSchema: schemas.definitions.PostUserReq as JSONSchema,
        resSchema: schemas.definitions.PostUserRes as JSONSchema,
      },
    },
    handlerFn: PostUser,
  });

  managementApiModule.endpoints.push({
    config: {
      routeProps: {
        method: HttpMethod.delete,
        path: "/:userid",
        docs: "Deletes a management user",
      },
      schema: {
        reqSchema: schemas.definitions.DeleteUserByUseridReq as JSONSchema,
        resSchema: schemas.definitions.DeleteUserByUseridReq as JSONSchema,
      },
    },
    handlerFn: DeleteUserById,
  });

  managementApiModule.endpoints.push({
    config: {
      routeProps: {
        method: HttpMethod.put,
        path: "/:userid",
        docs: "Updates a management user",
      },
      schema: {
        reqSchema: schemas.definitions.PutUserByUseridReq as JSONSchema,
        resSchema: schemas.definitions.PutUserByUseridRes as JSONSchema,
      },
    },
    handlerFn: PutUserById,
  });

  managementApiModule.endpoints.push({
    config: {
      routeProps: {
        method: HttpMethod.post,
        path: "/login",
        docs: "Authnticats a management user",
      },
      schema: {
        reqSchema: schemas.definitions.PostUserLoginReq as JSONSchema,
        resSchema: schemas.definitions.PostUserLoginRes as JSONSchema,
      },
    },
    handlerFn: PostUserLogin,
  });

  options.modules.push(managementApiModule);

  let moduleList: ModuleList = {
    modules: [],
  };
  options.modules.forEach((m) => {
    let module: Module = {
      id: m.id,
      ui: m.ui ? "true" : "false",
      type: m.type,
      icon: m.uiSettings?.icon || "",
      title: m.uiSettings?.title || "",
      //endpoints : [],
    };
    m.endpoints.forEach((e) => {
      let url = options.baseUrl || "/managementapi";
      url += "/" + m.id + e.config.routeProps.path;
      // module.endpoints.push({
      //   method : e.config.routeProps.method?.toString() || "get",
      //   url : url
      // });
    });
    moduleList.modules.push(module);
  });

  return {
    id: "managementApi",
    init: (app) => init(app, options),
    ctx: {
      jwtSecret: options.jwtSecret,
      moduleList,
    },
  };
};

function init(app: FlinkApp<any>, options: ManagementApiOptions) {
  let baseUrl = options.baseUrl || "/managementapi";
  if (!baseUrl.startsWith("/")) baseUrl = "/" + baseUrl;

  const { expressApp } = app;

  if (!expressApp) {
    throw new Error("Express app not initialized");
  }

  expressApp.use(baseUrl + "/*", (req: any, res: any, next: any) => {
    //Allow unauthenticated login requests
    if (req.baseUrl.startsWith(baseUrl + "/managementapiuser/login")) {
      next();
      return;
    }

    if (req.headers["management-token"] == options.token) {
      next();
    } else {
      try {
        const user = jsonwebtoken.verify(
          req.headers["management-token"],
          options.jwtSecret
        );
        next();
      } catch (ex) {
        res.status(401).json(unauthorized());
      }
    }
  });

  app.addHandler(
    {
      routeProps: {
        method: HttpMethod.get,
        path: baseUrl,
        docs: "Gets information about configured management api",
      },
    },
    GetManagement
  );

  if (app.db != null) {
    app.addRepo(
      "managementuserRepo",
      new managementuserRepo("ManagmentUserRepo", app.db)
    );
  }

  options.modules.forEach((module) => {
    module.endpoints.forEach((endpoint) => {
      endpoint.config.routeProps.path =
        baseUrl + "/" + module.id + endpoint.config.routeProps.path;
      app.addHandler(endpoint.config, endpoint.handlerFn);
    });
  });
}
