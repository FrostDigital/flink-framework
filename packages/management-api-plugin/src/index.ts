import {
  FlinkApp,
  FlinkPlugin,
  HttpMethod,
  unauthorized,
} from "@flink-app/flink";
import jsonwebtoken from "jsonwebtoken";
import * as GetManagement from "./handlers/Management/GetManagement";
import * as DeleteUserById from "./handlers/User/DeleteByUserid";
import * as GetUserByUserid from "./handlers/User/GetByUserid";
import * as GetUserList from "./handlers/User/GetList";
import * as GetUserMe from "./handlers/User/GetMe";
import * as PostUser from "./handlers/User/Post";
import * as PostUserLogin from "./handlers/User/PostLogin";
import * as PutUserById from "./handlers/User/PutByUserid";
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
      features: [],
    },
    endpoints: [],
    data : {}
  };

  managementApiModule.endpoints.push({
    handler: GetUserList,
    routeProps: {
      method: HttpMethod.get,
      path: "",
      docs: "List all management users",
    },
  });

  managementApiModule.endpoints.push({
    handler: GetUserMe,
    routeProps: {
      method: HttpMethod.get,
      path: "/me",
      docs: "Get current user information",
    },
  });

  managementApiModule.endpoints.push({
    handler: GetUserByUserid,
    routeProps: {
      method: HttpMethod.get,
      path: "/:userid",
      docs: "Get one management user by id",
    },
  });

  managementApiModule.endpoints.push({
    handler: PostUser,

    routeProps: {
      method: HttpMethod.post,
      path: "",
      docs: "Create a new management user",
    },
  });

  managementApiModule.endpoints.push({
    handler: DeleteUserById,

    routeProps: {
      method: HttpMethod.delete,
      path: "/:userid",
      docs: "Deletes a management user",
    },
  });

  managementApiModule.endpoints.push({
    handler: PutUserById,
    routeProps: {
      method: HttpMethod.put,
      path: "/:userid",
      docs: "Updates a management user",
    },
  });

  managementApiModule.endpoints.push({
    handler: PostUserLogin,
    routeProps: {
      method: HttpMethod.post,
      path: "/login",
      docs: "Authenticates a management user",
    },
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
      features: m.uiSettings?.features || [],
      title: m.uiSettings?.title || "",
      data : m.data
      //endpoints : [],
    };
    // m.endpoints.forEach((e) => {
    //   let url = options.baseUrl || "/managementapi";
    //   url += "/" + m.id + e.routeProps.path;
    //   // module.endpoints.push({
    //   //   method : e.config.routeProps.method?.toString() || "get",
    //   //   url : url
    //   // });
    // });
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

  app.addHandler(GetManagement, {
    path: baseUrl,
    method : HttpMethod.get, 
    docs: "Gets information about configured management api",
  });

  if (app.db != null) {
    app.addRepo(
      "managementuserRepo",
      new managementuserRepo("ManagmentUserRepo", app.db)
    );
  }

  options.modules.forEach((module) => {
    module.endpoints.forEach((endpoint) => {
      endpoint.routeProps.path =
        baseUrl + "/" + module.id + endpoint.routeProps.path;
      app.addHandler(endpoint.handler, endpoint.routeProps);
    });
  });
}
