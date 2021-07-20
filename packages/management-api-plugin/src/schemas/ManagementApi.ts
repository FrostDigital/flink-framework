import {  HandlerConfig, Handler } from "@flink-app/flink";


export interface ManagementApiEndpoint{
    config: HandlerConfig;
    handlerFn: Handler<any>;
  }
  export enum ManagementApiType{
    user = "USER",
    managementUser = "MANAGEMENT_USER"
  
  }
  export interface ManagementApiModule{
      id : string;
      type : ManagementApiType;
      endpoints : ManagementApiEndpoint[];
      ui : Boolean;
      uiSettings? : {
        title : string;
        features : string[];
      }
  
  }
  export interface ManagementApiOptions{
    token : string;
    baseUrl? : string;
    jwtSecret : string;
    modules : ManagementApiModule[];
  
  }