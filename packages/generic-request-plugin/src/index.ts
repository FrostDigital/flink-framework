import { FlinkApp, FlinkPlugin } from "@flink-app/flink";
import log from "node-color-log";


export enum HttpMethod {
    get = "get",
    post = "post",
    put = "put",
    delete = "delete",
  }



export type GenericRequestOptions = {
  /**
   * Path for request 
   */
  path: string;

  /**
   * Function to handle the request
   */
  handler: any;

  /**
   * Http method for this request
   */
  method : HttpMethod;

};

export const genericRequestPlugin = (options: GenericRequestOptions): FlinkPlugin => {
  return {
    id: "genericRequestPlugin",
    init: (app) => init(app, options),
  };
};

function init(app: FlinkApp<any>, options: GenericRequestOptions) {

  const { expressApp } = app;

  if (!expressApp) {
    throw new Error("Express app not initialized");
  }

  expressApp[options.method](options.path, (req, res) => {
      options.handler(req, res, app)
  });
  log.info(`Registered genericRequest route ${options.method} ${options.path}`);

}
