import { FlinkApp, FlinkPluginOptions } from "@flink-app/flink";
import { join } from "path";

export type ApiDocOptions = {
  /**
   * Path to where api docs can be accessed
   */
  path?: string;

  /**
   * Name of plugin
   */
  name?: string;

  /**
   * Title of API Docs, shown to end user who accesses API docs in browser.
   */
  title?: string;
};

export const apiDocPlugin = (
  options: ApiDocOptions = {}
): FlinkPluginOptions => {
  return {
    name: options.name || "API docs",
    init: (app) => init(app, options),
  };
};

function init(app: FlinkApp<any>, options: ApiDocOptions) {
  // TODO: Use parsedHandlerConfig
  const { expressApp, handlerConfig, schemas } = app;

  if (!expressApp) {
    // should not happen
    throw new Error("Express app not initialized");
  }

  // NOTE: This will probably break if any other plugin "claims" pug as view engine
  expressApp.engine("pug", require("pug").__express);
  expressApp.set("views", join(__dirname, "views"));
  expressApp.set("view engine", "pug");

  expressApp?.get(options.path || "/docs", (req, res) => {
    let routes = [];

    for (const k in handlerConfig) {
      routes.push(handlerConfig[k]);
    }

    routes = routes.sort((routeA, routeB) =>
      routeA.routeProps.path.localeCompare(routeB.routeProps.path)
    );

    res.render("index", {
      title: options.title || "API Docs",
      routes,
      schemas,
    });
  });
}
