import { HandlerFile, RouteProps } from "@flink-app/flink";

export interface ManagementApiModule {
  id: string;
  type: ManagementApiType;
  endpoints: { handler: HandlerFile; routeProps: Partial<RouteProps> }[];
  ui: boolean;
  uiSettings?: {
    title: string;
    icon: string;
    features: string[];
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
