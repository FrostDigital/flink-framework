import { Handler, HandlerConfigWithMethod } from "@flink-app/flink";

export interface ManagementApiEndpoint {
  config: HandlerConfigWithMethod;
  handlerFn: Handler<any>;
}

export interface ManagementApiModule {
  id: string;
  type: ManagementApiType;
  endpoints: ManagementApiEndpoint[];
  ui: Boolean;
  uiSettings?: {
    title: string;
    icon: string;
  };
}
export interface ManagementApiOptions {
  token: string;
  baseUrl?: string;
  jwtSecret: string;
  modules: ManagementApiModule[];
}

export enum ManagementApiType {
  user = "USER",
  managementUser = "MANAGEMENT_USER",
}
