import Ajv from "ajv";
import addFormats from "ajv-formats";
import bodyParser from "body-parser";
import cors from "cors";
import express, { Express, Request } from "express";
import { promises as fsPromises } from "fs";
import mongodb, { Db } from "mongodb";
import log from "node-color-log";
import { join, sep } from "path";
import * as TJS from "typescript-json-schema";
import { v4 } from "uuid";
import { FlinkAuthPlugin } from "./auth/FlinkAuthPlugin";
import { FlinkContext } from "./FlinkContext";
import { internalServerError, notFound, unauthorized } from "./FlinkErrors";
import { Handler, HttpMethod, RouteProps } from "./FlinkHttpHandler";
import { FlinkPluginOptions } from "./FlinkPlugin";
import { FlinkRepo } from "./FlinkRepo";
import { FlinkResponse } from "./FlinkResponse";
import { readJsonFile } from "./FsUtils";
import generateMockData from "./mock-data-generator";
import { getCollectionNameForRepo, isError } from "./utils";

const ajv = new Ajv();
addFormats(ajv);

const defaultCorsOptions: FlinkOptions["cors"] = {
  allowedHeaders: "",
  credentials: true,
  origin: ["*"],
};

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
   */
  loader: (file: string) => Promise<any>;

  /**
   * Optional list of plugins that should be configured and used.
   */
  plugins?: FlinkPluginOptions[];

  /**
   * Plugin used for authentication.
   */
  auth?: FlinkAuthPlugin;

  /**
   * Optional cors options.
   */
  cors?: {
    /**
     * Origin(s) to allow, defaults ["*"]
     */
    origin?: string[];

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

type HandlerConfig = {
  [x: string]: {
    schema: { reqSchema?: string; resSchema?: string };
    routeProps: RouteProps;
    method?: HttpMethod;
  };
};

export class FlinkApp<C extends FlinkContext> {
  public name: string;
  public expressApp?: Express;
  public db?: Db;
  public parsedHandlerConfig: HandlerConfig = {};
  public schemas: { [x: string]: TJS.Definition } = {};

  private port?: number;
  private ctx?: C;
  private dbOpts?: FlinkOptions["db"];
  private debug = false;
  private onDbConnection?: FlinkOptions["onDbConnection"];

  private loader: FlinkOptions["loader"];
  private plugins: FlinkPluginOptions[] = [];
  private auth?: FlinkAuthPlugin;
  private corsOpts: FlinkOptions["cors"];
  private appRoot: string;

  constructor(opts: FlinkOptions) {
    this.name = opts.name;
    this.port = opts.port || 3333;
    this.dbOpts = opts.db;
    this.debug = !!opts.debug;
    this.onDbConnection = opts.onDbConnection;
    this.loader = opts.loader;
    this.plugins = opts.plugins || [];
    this.corsOpts = { ...defaultCorsOptions, ...opts.cors };
    this.auth = opts.auth;
    this.appRoot = opts.appRoot || "./";
  }

  async start() {
    const startTime = Date.now();
    let offsetTime = 0;

    this.parsedHandlerConfig = await readJsonFile(".flink/handlers.json");
    this.schemas = (await readJsonFile(".flink/schemas.json")) || {};

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

    // TODO: Add better more fine grained control when plugins are initialized

    this.plugins.map((plugin) => {
      plugin.init(this);
      log.info(`Initialized plugin '${plugin.name}'`);
    });

    await this.registerHandlers();

    if (this.debug) {
      log.bgColorLog(
        "cyan",
        `Register handlers took ${Date.now() - offsetTime} ms`
      );
      offsetTime = Date.now();
    }

    this.expressApp.use((req, res, next) => {
      res.status(404).json(notFound());
    });

    this.expressApp.listen(this.port, () => {
      log.fontColorLog(
        "magenta",
        `⚡️ HTTP server '${this.name}' is running and waiting for connections on ${this.port}`
      );
    });
  }

  private async registerHandlers() {
    const app = this.expressApp!;
    const handlerRouteCache = new Map<string, string>();

    for (const handler of Object.keys(this.parsedHandlerConfig)) {
      if (handler.endsWith(".ts")) {
        const { default: oHandlerFn } = await this.loader(
          "./handlers/" + handler
        );

        const handlerFn: Handler<C> = oHandlerFn;
        const { routeProps, schema } = this.parsedHandlerConfig[handler];

        if (!routeProps) {
          log.error(`Missing Props in handler ${handler}`);
          continue;
        }

        if (!handlerFn) {
          log.error(`Missing exported handler function in handler ${handler}`);
          continue;
        }

        if (!this.ctx) {
          throw new Error(
            "Context does not exist (yet), make sure to build context prior to registering handlers"
          );
        }

        const method = routeProps.method
          ? routeProps.method
          : this.getHttpMethodFromHandlerName(handler);

        if (method) {
          const methodAndRoute = `${method.toUpperCase()} ${routeProps.path}`;

          app[method](routeProps.path, async (req, res) => {
            if (routeProps.authenticated) {
              if (!(await this.authenticate(req))) {
                return res.status(401).json(unauthorized());
              }
            }

            if (schema.reqSchema) {
              const reqSchema = this.schemas[schema.reqSchema];

              if (!reqSchema) {
                log.error(
                  `Missing request schema ${schema.reqSchema} for handler ${handler} - skipping validation`
                );
              } else {
                const validate = ajv.compile(reqSchema);
                const valid = validate(req.body);

                if (!valid) {
                  log.warn(
                    `${methodAndRoute}: Bad request (using schema ${
                      schema.reqSchema
                    }) ${JSON.stringify(validate.errors, null, 2)}`
                  );

                  log.debug(`Invalid json: ${JSON.stringify(req.body)}`);

                  return res.status(400).json({
                    status: 400,
                    error: {
                      id: v4(),
                      title: "Bad request",
                      detail: `Schema ${
                        schema.reqSchema
                      } did not validate ${JSON.stringify(validate.errors)}`,
                    },
                  });
                }
              }
            }

            if (routeProps.mockApi && schema.resSchema) {
              log.warn(
                `Mock response for ${req.method.toUpperCase()} ${req.path}`
              );
              const resSchema = this.getSchema(schema.resSchema);

              if (resSchema) {
                const data = generateMockData(resSchema);
                res.status(200).json({
                  status: 200,
                  data,
                });
                return;
              }
            }

            let handlerRes: FlinkResponse<any>;

            try {
              // 👇 This is where the actual handler gets invoked
              handlerRes = await handlerFn({ req, ctx: this.ctx! });
            } catch (err) {
              log.warn(
                `Handler '${methodAndRoute}' threw unhandled exception ${err}`
              );
              return res.status(500).json(internalServerError(err));
            }

            if (schema.resSchema && !isError(handlerRes)) {
              const resSchema = this.getSchema(schema.resSchema);

              if (!resSchema) {
                log.error(
                  `Missing response schema ${schema.resSchema} for handler ${handler} - skipping validation`
                );
              } else {
                const validate = ajv.compile(resSchema);
                const valid = validate(
                  JSON.parse(JSON.stringify(handlerRes.data))
                );

                if (!valid) {
                  log.warn(
                    `[${
                      req.reqId
                    }] ${methodAndRoute}: Bad response (using schema ${
                      schema.resSchema
                    }) ${JSON.stringify(validate.errors, null, 2)}`
                  );
                  log.debug(`Invalid json: ${JSON.stringify(handlerRes.data)}`);
                  // log.debug(JSON.stringify(schema, null, 2));

                  return res.status(500).json({
                    status: 500,
                    error: {
                      id: v4(),
                      title: "Bad response",
                      detail: `Schema ${
                        schema.resSchema
                      } did not validate ${JSON.stringify(validate.errors)}`,
                    },
                  });
                }
              }
            }

            res.set(handlerRes.headers);

            res.status(handlerRes.status || 200).json(handlerRes);
          });

          if (handlerRouteCache.get(methodAndRoute)) {
            log.error(
              `Cannot register handler ${handler} - route ${methodAndRoute} already registered by handler ${handlerRouteCache.get(
                methodAndRoute
              )}`
            );
            return process.exit(1); // TODO: Do we need to exit?
          } else {
            handlerRouteCache.set(methodAndRoute, handler);
            log.info(`${handler}: ${methodAndRoute}`);
          }
        }
      }
    }
  }

  /**
   * Get http method from props or convention based on file name
   * if it starts with i.e "GetFoo"
   */
  private getHttpMethodFromHandlerName(handlerFilename: string) {
    if (handlerFilename.includes(sep)) {
      const split = handlerFilename.split(sep);
      handlerFilename = split[split.length - 1];
    }

    handlerFilename = handlerFilename.toLocaleLowerCase();

    if (handlerFilename.startsWith(HttpMethod.get)) return HttpMethod.get;
    if (handlerFilename.startsWith(HttpMethod.post)) return HttpMethod.post;
    if (handlerFilename.startsWith(HttpMethod.put)) return HttpMethod.put;
    if (handlerFilename.startsWith(HttpMethod.delete)) return HttpMethod.delete;

    log.error(
      "Handlers should either be prefixed with HTTP method, such as `PostFoo`, or have instance method `method` set."
    );
  }

  /**
   * Constructs the app context. Will inject context in all components
   * except for handlers which are handled in later stage.
   */
  private async buildContext() {
    const reposRoot = join(this.appRoot, "src", "repos");

    let repoFilenames: string[] = [];

    try {
      repoFilenames = await fsPromises.readdir(reposRoot);
    } catch (err) {}

    const repos: { [x: string]: FlinkRepo<C> } = {};

    if (repoFilenames.length > 0) {
      const repoFilenames = await fsPromises.readdir(reposRoot);

      if (this.dbOpts) {
        for (const fn of repoFilenames) {
          const repoInstanceName = this.getRepoInstanceName(fn);
          const { default: Repo } = await this.loader("./repos/" + fn);
          const repoInstance: FlinkRepo<C> = new Repo(
            getCollectionNameForRepo(fn),
            this.db
          );

          repos[repoInstanceName] = repoInstance;
          log.info(`Registered repo ${repoInstanceName}`);
        }
      } else if (repoFilenames.length > 0) {
        log.warn(
          `No db configured but found repo(s) in ${reposRoot}: ${repoFilenames.join(
            ", "
          )}`
        );
      }
    } else {
      log.debug(`Skipping repos - no repos in ${reposRoot} found`);
    }

    this.ctx = {
      repos,
      plugins: {}, // TODO: Expose plugin in ctx?
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
   * Constructs repo instance name based on
   * filename.
   *
   * For example `FooRepo.ts` will become `fooRepo`.
   */
  private getRepoInstanceName(fn: string) {
    const [name] = fn.split(".ts");
    return name.charAt(0).toLowerCase() + name.substr(1);
  }

  private getSchema(schemaName: string) {
    const schema = this.schemas[schemaName];

    if (!schema) {
      log.error(`Missing schema '${schemaName}'`);
    }

    return schema;
  }

  /**
   *
   */
  private async authenticate(req: Request) {
    if (!this.auth) {
      throw new Error(
        `Attempting to authenticate request (${req.method} ${req.path}) but no authPlugin is set`
      );
    }

    return await this.auth.authenticateRequest(req);
  }
}
