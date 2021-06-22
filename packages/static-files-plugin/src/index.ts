import { FlinkApp, FlinkPlugin } from "@flink-app/flink";
  import express from "express";
import log from "node-color-log";

export type StaticOptions = {
  /**
   * Base url 
   */
  path: string;

  /**
   * Path of template files
   */
  folder: string;

};

export const staticFilesPlugin = (options: StaticOptions): FlinkPlugin => {
  return {
    id: "staticFiles",
    init: (app) => init(app, options),
  };
};

function init(app: FlinkApp<any>, options: StaticOptions) {

  const { expressApp } = app;

  if (!expressApp) {
    throw new Error("Express app not initialized");
  }

  log.info(`Registered static file route ${options.path}`);

  expressApp.use(options.path, express.static(options.folder));

}
