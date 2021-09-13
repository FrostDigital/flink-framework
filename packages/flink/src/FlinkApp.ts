import Ajv from "ajv";
import addFormats from "ajv-formats";
import bodyParser from "body-parser";
import cors from "cors";
import express, { Express, Request } from "express";
import { JSONSchema7 } from "json-schema";
import mongodb, { Db } from "mongodb";
import log from "node-color-log";
import { v4 } from "uuid";
import { FlinkAuthPlugin } from "./auth/FlinkAuthPlugin";
import { FlinkContext } from "./FlinkContext";
import { internalServerError, notFound, unauthorized } from "./FlinkErrors";
import {
  Handler,
  HandlerFile,
  HttpMethod,
  QueryParamMetadata,
  RouteProps,
} from "./FlinkHttpHandler";
import { FlinkPlugin } from "./FlinkPlugin";
import { FlinkRepo } from "./FlinkRepo";
import { FlinkResponse } from "./FlinkResponse";
import generateMockData from "./mock-data-generator";
import { isError } from "./utils";

const ajv = new Ajv();
addFormats(ajv);

const defaultCorsOptions: FlinkOptions["cors"] = {
  allowedHeaders: "",
  credentials: true,
  origin: [/.*/],
};

export type JSONSchema = JSONSchema7;

/**
 * This will be populated at compile time when the apps handlers
 * are picked up by typescript compiler
 */
export const autoRegisteredHandlers: {
  handler: HandlerFile;
  assumedHttpMethod: HttpMethod;
}[] = [];

/**
 * This will be populated at compile time when the apps repos
 * are picked up by typescript compiler
 */
export const autoRegisteredRepos: {
  collectionName: string;
  repoInstanceName: string;
  Repo: any;
}[] = [];

export interface FlinkOptions {
  /**
   * Name of application, will only show in logs and in HTTP header.
   */
  name: string;

  /**
   * HTTP port
   * @default 3333
   */
  port?: number;

  /**
   * Configuration related to database.
   * Leave empty if no database is needed.
   */
  db?: {
    /**
     * Uri to mongodb including any username and password.
     * @example mongodb://localhost:27017/my-db
     */
    uri: string;
  };

  /**
   * Optional debug options, used to log and debug Flink internals.
   */
  debug?: boolean;

  /**
   * Callback invoked after database was connected
   * end before application starts.
   *
   * A good place to for example ensure database indexes.
   */
  onDbConnection?: (db: Db) => Promise<void>;

  /**
   * Callback invoked so Flink can load files from host project.
   * @deprecated not needed anymore since new `flink run`
   */
  loader?: (file: string) => Promise<any>;

  /**
   * Optional list of plugins that should be configured and used.
   */
  plugins?: FlinkPlugin[];

  /**
   * Plugin used for authentication.
   */
  auth?: FlinkAuthPlugin;

  /**
   * Optional cors options.
   */
  cors?: {
    /**
     * Origin(s) to allow
     */
    origin?: RegExp[];

    credentials?: boolean;

    /**
     * Specify allowed headers for CORS, can be a comma separated string if multiple
     * Defaults to none.
     */
    allowedHeaders?: string;
  };

  /**
   * Optional root folder of app. Defaults to `./`
   */
  appRoot?: string;
}

export interface HandlerConfig {
  schema?: {
    reqSchema?: JSONSchema;
    resSchema?: JSONSchema;
  };
  routeProps: RouteProps;
  queryMetadata: QueryParamMetadata[];
  paramsMetadata: QueryParamMetadata[];
}

export interface HandlerConfigWithMethod extends HandlerConfig {
  routeProps: RouteProps & { method: HttpMethod };
}
export interface HandlerConfigWithSchemaRefs
  extends Omit<HandlerConfig, "schema" | "origin"> {
  schema?: {
    reqSchema?: string;
    resSchema?: string;
  };
}

export class FlinkApp<C extends FlinkContext> {
  public name: string;
  public expressApp?: Express;
  public db?: Db;
  public handlers: HandlerConfig[] = [];
  public port?: number;
  public started = false;

  private _ctx?: C;
  private dbOpts?: FlinkOptions["db"];
  private debug = false;
  private onDbConnection?: FlinkOptions["onDbConnection"];

  private plugins: FlinkPlugin[] = [];
  private auth?: FlinkAuthPlugin;
  private corsOpts: FlinkOptions["cors"];
  private routingConfigured = false;

  private repos: { [x: string]: FlinkRepo<C> } = {};

  /**
   * Internal cache used to track registered handlers and potentially any overlapping routes
   */
  private handlerRouteCache = new Map<string, string>();

  constructor(opts: FlinkOptions) {
    this.name = opts.name;
    this.port = opts.port || 3333;
    this.dbOpts = opts.db;
    this.debug = !!opts.debug;
    this.onDbConnection = opts.onDbConnection;
    this.plugins = opts.plugins || [];
    this.corsOpts = { ...defaultCorsOptions, ...opts.cors };
    this.auth = opts.auth;
  }

  get ctx() {
    if (!this._ctx) {
      throw new Error("Context is not yet initialized");
    }
    return this._ctx;
  }

  async start() {
    const startTime = Date.now();
    let offsetTime = 0;

    await this.initDb();

    if (this.debug) {
      offsetTime = Date.now();
      log.bgColorLog("cyan", `Init db took ${offsetTime - startTime} ms`);
    }

    await this.buildContext();

    if (this.debug) {
      log.bgColorLog(
        "cyan",
        `Build context took ${Date.now() - offsetTime} ms`
      );
      offsetTime = Date.now();
    }

    if (this.debug) {
      log.bgColorLog(
        "cyan",
        `Registered JSON schemas took ${Date.now() - offsetTime} ms`
      );
      offsetTime = Date.now();
    }

    this.expressApp = express();

    this.expressApp.use(cors(this.corsOpts));

    this.expressApp.use(bodyParser.json());

    this.expressApp.use((req, res, next) => {
      req.reqId = v4();
      next();
    });

    // TODO: Add better more fine grained control when plugins are initialized, i.e. in what order

    for (const plugin of this.plugins) {
      let db;

      if (plugin.db) {
        db = await this.initPluginDb(plugin);
      }

      if (plugin.init) {
        await plugin.init(this, db);
      }

      log.info(`Initialized plugin '${plugin.id}'`);
    }

    await this.registerAutoRegisterableHandlers();

    if (this.debug) {
      log.bgColorLog(
        "cyan",
        `Register handlers took ${Date.now() - offsetTime} ms`
      );
      offsetTime = Date.now();
    }

    // Register 404 with slight delay to allow all manually added routes to be added
    // TODO: Is there a better solution to force this handler to always run last?
    setTimeout(() => {
      this.expressApp!.use((req, res, next) => {
        res.status(404).json(notFound());
      });

      this.routingConfigured = true;
    });

    this.expressApp?.listen(this.port, () => {
      log.fontColorLog(
        "magenta",
        `⚡️ HTTP server '${this.name}' is running and waiting for connections on ${this.port}`
      );

      this.started = true;
    });

    return this;
  }

  /**
   * Manually registers a handler.
   *
   * Typescript compiler will scan handler function and set schemas
   * which are derived from handler function type arguments.
   */
  public addHandler(
    handler: HandlerFile,
    routePropsOverride?: Partial<HandlerConfig["routeProps"]>
  ) {
    if (this.routingConfigured) {
      throw new Error(
        "Cannot add handler after routes has been registered, make sure to invoke earlier"
      );
    }

    const routeProps = { ...(handler.Route || {}), ...routePropsOverride };

    if (!routeProps.method) {
      log.error(
        `Failed to register handler '${handler.__file}': Missing 'method' in route props, either set it or name handler file with HTTP method as prefix`
      );
      return;
    }

    if (!routeProps.path) {
      log.error(
        `Failed to register handler '${handler.__file}': Missing 'path' in route props`
      );
      return;
    }

    const dup = this.handlers.find(
      (h) =>
        h.routeProps.path === routeProps.path &&
        h.routeProps.method === routeProps.method
    );

    const methodAndPath = `${routeProps.method.toUpperCase()} ${
      routeProps.path
    }`;

    if (dup) {
      // TODO: Not sure if there is a case where you'd want to overwrite a route?
      log.warn(`${methodAndPath} overlaps existing route`);
    }

    const handlerConfig: HandlerConfigWithMethod = {
      routeProps: {
        ...routeProps,
        method: routeProps.method!,
        path: routeProps.path!,
      },
      schema: {
        reqSchema: handler.__schemas?.reqSchema,
        resSchema: handler.__schemas?.resSchema,
      },
      queryMetadata: handler.__query || [],
      paramsMetadata: handler.__params || [],
    };

    if (handler.__schemas?.reqSchema && !handlerConfig.schema?.reqSchema) {
      log.warn(
        `Expected request schema ${handler.__schemas.reqSchema} for handler ${methodAndPath} but no such schema was found`
      );
    }

    if (handler.__schemas?.resSchema && !handlerConfig.schema?.resSchema) {
      log.warn(
        `Expected response schema ${handler.__schemas.resSchema} for handler ${methodAndPath} but no such schema was found`
      );
    }

    this.registerHandler(handlerConfig, handler.default);
  }

  private registerHandler(handlerConfig: HandlerConfig, handler: Handler<any>) {
    this.handlers.push(handlerConfig);

    const { routeProps, schema = {} } = handlerConfig;
    const { method } = routeProps;
    const app = this.expressApp!;

    if (!method) {
      log.error(`Route ${routeProps.path} is missing http method`);
    }

    if (method) {
      const methodAndRoute = `${method.toUpperCase()} ${routeProps.path}`;

      app[method](routeProps.path, async (req, res) => {
        if (routeProps.permissions) {
          if (!(await this.authenticate(req, routeProps.permissions))) {
            return res.status(401).json(unauthorized());
          }
        }

        if (schema.reqSchema) {
          const validate = ajv.compile(schema.reqSchema);
          const valid = validate(req.body);

          if (!valid) {
            log.warn(
              `${methodAndRoute}: Bad request ${JSON.stringify(
                validate.errors,
                null,
                2
              )}`
            );

            log.debug(`Invalid json: ${JSON.stringify(req.body)}`);

            return res.status(400).json({
              status: 400,
              error: {
                id: v4(),
                title: "Bad request",
                detail: `Schema did not validate ${JSON.stringify(
                  validate.errors
                )}`,
              },
            });
          }
        }

        if (routeProps.mockApi && schema.resSchema) {
          log.warn(`Mock response for ${req.method.toUpperCase()} ${req.path}`);

          const data = generateMockData(schema.resSchema);

          res.status(200).json({
            status: 200,
            data,
          });
          return;
        }

        let handlerRes: FlinkResponse<any>;

        try {
          // 👇 This is where the actual handler gets invoked
          handlerRes = await handler({
            req,
            ctx: this.ctx,
            origin: routeProps.origin,
          });
        } catch (err) {
          log.warn(
            `Handler '${methodAndRoute}' threw unhandled exception ${err}`
          );
          return res.status(500).json(internalServerError(err));
        }

        if (schema.resSchema && !isError(handlerRes)) {
          const validate = ajv.compile(schema.resSchema);
          const valid = validate(JSON.parse(JSON.stringify(handlerRes.data)));

          if (!valid) {
            log.warn(
              `[${req.reqId}] ${methodAndRoute}: Bad response ${JSON.stringify(
                validate.errors,
                null,
                2
              )}`
            );
            log.debug(`Invalid json: ${JSON.stringify(handlerRes.data)}`);
            // log.debug(JSON.stringify(schema, null, 2));

            return res.status(500).json({
              status: 500,
              error: {
                id: v4(),
                title: "Bad response",
                detail: `Schema did not validate ${JSON.stringify(
                  validate.errors
                )}`,
              },
            });
          }
        }

        res.set(handlerRes.headers);

        res.status(handlerRes.status || 200).json(handlerRes);
      });

      if (this.handlerRouteCache.has(methodAndRoute)) {
        log.error(
          `Cannot register handler ${methodAndRoute} - route already registered`
        );
        return process.exit(1); // TODO: Do we need to exit?
      } else {
        this.handlerRouteCache.set(methodAndRoute, JSON.stringify(routeProps));
        log.info(`Registered route ${methodAndRoute}`);
      }
    }
  }

  /**
   * Register handlers found within the `/src/handlers`
   * directory in Flink App.
   *
   * Will not register any handlers added programmatically.
   */
  private async registerAutoRegisterableHandlers() {
    for (const { handler, assumedHttpMethod } of autoRegisteredHandlers) {
      if (!handler.Route) {
        log.error(`Missing Props in handler ${handler.__file}`);
        continue;
      }

      if (!handler.default) {
        log.error(
          `Missing exported handler function in handler ${handler.__file}`
        );
        continue;
      }

      this.registerHandler(
        {
          routeProps: {
            ...handler.Route,
            method: handler.Route.method || assumedHttpMethod,
            origin: this.name,
          },
          schema: {
            reqSchema: handler.__schemas?.reqSchema,
            resSchema: handler.__schemas?.resSchema,
          },
          queryMetadata: handler.__query || [],
          paramsMetadata: handler.__params || [],
        },
        handler.default
      );
    }
  }

  public addRepo(instanceName: string, repoInstance: FlinkRepo<C>) {
    this.repos[instanceName] = repoInstance;
  }

  /**
   * Constructs the app context. Will inject context in all components
   * except for handlers which are handled in later stage.
   */
  private async buildContext() {
    if (this.dbOpts) {
      for (const {
        collectionName,
        repoInstanceName,
        Repo,
      } of autoRegisteredRepos) {
        const repoInstance: FlinkRepo<C> = new Repo(collectionName, this.db);

        this.repos[repoInstanceName] = repoInstance;

        log.info(`Registered repo ${repoInstanceName}`);
      }
    } else if (autoRegisteredRepos.length > 0) {
      log.warn(`No db configured but found repo(s)`);
    }

    const pluginCtx = this.plugins.reduce<{ [x: string]: any }>(
      (out, plugin) => {
        if (out[plugin.id]) {
          throw new Error(`Plugin ${plugin.id} is already registered`);
        }
        out[plugin.id] = plugin.ctx;
        return out;
      },
      {}
    );

    this._ctx = {
      repos: this.repos,
      plugins: pluginCtx,
      auth: this.auth,
    } as C;
  }

  /**
   * Connects to database.
   */
  private async initDb() {
    if (this.dbOpts) {
      try {
        log.debug("Connecting to db");
        const client = await mongodb.connect(this.dbOpts.uri, {
          useUnifiedTopology: true,
          connectTimeoutMS: 4000,
        });
        this.db = client.db();
      } catch (err) {
        log.error("Failed to connect to db: " + err);
        process.exit(1);
      }

      if (this.onDbConnection) {
        await this.onDbConnection(this.db);
      }
    }
  }

  /**
   * Connects plugin to database.
   */
  private async initPluginDb(plugin: FlinkPlugin) {
    if (!plugin.db) {
      return;
    }

    if (plugin.db) {
      if (plugin.db.useHostDb) {
        if (!this.db) {
          log.error(
            `Plugin '${this.name} configured to use host app db, but no db exists in FlinkApp'`
          );
        } else {
          return this.db;
        }
      } else if (plugin.db.uri) {
        try {
          log.debug(`Connecting to '${plugin.id}' db`);
          const client = await mongodb.connect(plugin.db.uri, {
            useUnifiedTopology: true,
          });
          return client.db();
        } catch (err) {
          log.error(
            `Failed to connect to db defined in plugin '${plugin.id}': ` + err
          );
        }
      }
    }
  }

  private async authenticate(req: Request, permissions: string | string[]) {
    if (!this.auth) {
      throw new Error(
        `Attempting to authenticate request (${req.method} ${req.path}) but no authPlugin is set`
      );
    }
    return await this.auth.authenticateRequest(req, permissions);
  }

  public getRegisteredRoutes() {
    return Array.from(this.handlerRouteCache.values());
  }
}
