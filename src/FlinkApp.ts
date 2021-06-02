import Ajv from "ajv";
import addFormats from "ajv-formats";
import express, { Express } from "express";
import { promises as fsPromises } from "fs";
import mongodb, { Db } from "mongodb";
import log from "node-color-log";
import { join, resolve, sep } from "path";
import { SourceFile } from "typescript";
import * as TJS from "typescript-json-schema";
import { v4 } from "uuid";
import { FlinkContext } from "./FlinkContext";
import { Handler, HttpMethod, RouteProps } from "./FlinkHttpHandler";
import { FlinkRepo } from "./FlinkRepo";
import { getSchemaFromHandlerSourceFile } from "./FlinkTsUtils";
import generateMockData from "./mock-data-generator";
import {
  getCollectionNameForRepo,
  getHandlerFiles,
  getSchemaFiles,
  handlersPath,
  isError,
  isRouteMatch,
  schemasPath,
} from "./utils";

const ajv = new Ajv();
addFormats(ajv);
interface FlinkOptions {
  /**
   * Name of application, will only show in logs and in HTTP header.
   */
  name: string;

  /**
   * If to enable API documentation based on JSON schemas.
   * @default true
   */
  enableApiDocs?: boolean; // TODO

  /**
   * HTTP port
   * @default 3333
   */
  port?: number;

  /**
   * Configuration related to database.
   * Leave empty if no
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
   * If API should respond with mock data based on response JSON schemas.
   * Either set `true` to mock all or provide array with routes that
   * should be mocked.
   *
   * This can also be set from handlers route props.
   */
  mockApi?: true | { method: HttpMethod; path: string }[];

  /**
   * Callback invoked after database was connected
   * end before application starts.
   *
   * A good place to for example ensure database indexes.
   */
  onDbConnection?: (db: Db) => Promise<void>;

  loader: (file: string) => Promise<any>;
}

export class FlinkApp<C extends FlinkContext> {
  name: string;
  enableApiDocs: boolean;
  port?: number;
  app?: Express;
  schemas: { [x: string]: TJS.Definition } = {};
  ctx?: C;
  dbOpts?: FlinkOptions["db"];
  db?: Db;
  debug = false;
  mockApiOpts: FlinkOptions["mockApi"];
  onDbConnection?: FlinkOptions["onDbConnection"];
  private assumedSchemas = new Map<
    string,
    { reqSchema?: string; resSchema?: string }
  >();
  loader: FlinkOptions["loader"];

  constructor(opts: FlinkOptions) {
    this.name = opts.name;
    this.enableApiDocs =
      typeof opts.enableApiDocs === "undefined" ? true : opts.enableApiDocs;
    this.port = opts.port || 3333;
    this.dbOpts = opts.db;
    this.debug = !!opts.debug;
    this.mockApiOpts = opts.mockApi;
    this.onDbConnection = opts.onDbConnection;
    this.loader = opts.loader;
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

    await this.registerSchemas();

    if (this.debug) {
      log.bgColorLog(
        "cyan",
        `Registered JSON schemas took ${Date.now() - offsetTime} ms`
      );
      offsetTime = Date.now();
    }

    this.app = express();

    this.app.use((req, res, next) => {
      req.reqId = v4();
      next();
    });

    await this.registerHandlers();

    if (this.debug) {
      log.bgColorLog(
        "cyan",
        `Register handlers took ${Date.now() - offsetTime} ms`
      );
      offsetTime = Date.now();
    }

    this.app.listen(this.port, () => {
      log.fontColorLog(
        "magenta",
        `⚡️ HTTP server '${this.name}' is running and waiting for connections on ${this.port}`
      );
    });
  }

  async registerHandlers() {
    const handlers = await getHandlerFiles();
    const app = this.app!;
    const handlerRouteCache = new Map<string, string>();

    for (const handler of handlers) {
      if (handler.endsWith(".ts")) {
        // TODO: Implement support for handlers in nested folders such as src/handlers/car/GetCar.ts
        const { default: oHandlerFn, Route } = await this.loader(
          "./handlers/" + handler
        );

        const handlerFn: Handler<C> = oHandlerFn;
        const props: RouteProps = Route;

        if (!props) {
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

        if (this.assumedSchemas.has(handler)) {
          const schemasFromGeneric = this.assumedSchemas.get(handler);
          props.reqSchema = props.reqSchema || schemasFromGeneric?.reqSchema;
          props.resSchema = props.resSchema || schemasFromGeneric?.resSchema;
        }

        const method = this.getHttpMethodForHandler(props, handler);

        if (method) {
          app[method](props.path, async (req, res) => {
            if (props.reqSchema) {
              const schema = this.schemas[props.reqSchema];

              if (!schema) {
                log.error(
                  `Missing request schema ${props.reqSchema} for handler ${handler} - skipping validation`
                );
              } else {
                const validate = ajv.compile(schema);
                const valid = validate(req.body);

                if (!valid) {
                  log.warn(`Bad request ${validate.errors}`);
                  return res.status(400).json({
                    status: 400,
                    error: {
                      id: v4(),
                      title: "Bad request",
                      detail: `Schema ${
                        props.reqSchema
                      } did not validate ${JSON.stringify(validate.errors)}`,
                    },
                  });
                }
              }
            }

            if ((this.mockApiOpts || props.mockApi) && props.resSchema) {
              const shouldMock =
                !Array.isArray(this.mockApiOpts) ||
                isRouteMatch(req, this.mockApiOpts);

              if (shouldMock) {
                log.warn(
                  `Mock response for ${req.method.toUpperCase()} ${req.path}`
                );
                const schema = this.getSchema(props.resSchema);

                if (schema) {
                  const data = generateMockData(schema);
                  res.status(200).json({
                    status: 200,
                    data,
                  });
                  return;
                }
              }
            }

            // 👇 This is where the actual handler gets invoked
            const handlerRes = await handlerFn({ req, ctx: this.ctx! });

            if (props.resSchema && !isError(handlerRes)) {
              const schema = this.schemas[props.resSchema];

              if (!schema) {
                log.error(
                  `Missing response schema ${props.resSchema} for handler ${handler} - skipping validation`
                );
              } else {
                const validate = ajv.compile(schema);
                const valid = validate(handlerRes.data);

                if (!valid) {
                  log.warn(
                    `Bad response ${JSON.stringify(validate.errors, null, 2)}`
                  );
                  log.debug(JSON.stringify(schema, null, 2));

                  return res.status(500).json({
                    status: 500,
                    error: {
                      id: v4(),
                      title: "Bad response",
                      detail: `Schema ${
                        props.resSchema
                      } did not validate ${JSON.stringify(validate.errors)}`,
                    },
                  });
                }
              }
            }

            res.status(handlerRes.status || 200).json(handlerRes);
          });

          const methodAndRoute = `${method.toUpperCase()} ${props.path}`;

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
   * Reads schema dir (src/schemas) and parses JSON schema
   * from typescript interfaces.
   *
   * This is a quite time consuming task so cache logic is
   * implemented so that any previous schemas will be reused
   * as long as the schema dir has not altered since last run.
   */
  async registerSchemas() {
    const schemas = await getSchemaFiles();
    const handlers = await getHandlerFiles();

    if (!schemas.length && !handlers.length) {
      log.warn("No schemas nor handlers found");
      return;
    }

    const programFiles: string[] = [];

    if (schemas.length) {
      programFiles.push(
        ...schemas.map((filename) => resolve(join(schemasPath, filename)))
      );
    }

    if (handlers.length) {
      programFiles.push(
        ...handlers.map((filename) => resolve(join(handlersPath, filename)))
      );
    }

    const program = TJS.getProgramFromFiles(programFiles, {
      esModuleInterop: true,
    });

    const settings: TJS.PartialArgs = {
      required: true,
      ref: false,
      noExtraProps: true,
    };

    // Group source files
    const { schemaFiles, handlerFiles } = program
      .getSourceFiles()
      .reduce<{ schemaFiles: SourceFile[]; handlerFiles: SourceFile[] }>(
        (prev, file) => {
          if (file.fileName.includes(schemasPath)) {
            prev.schemaFiles = [...prev.schemaFiles, file];
          } else if (file.fileName.includes(handlersPath)) {
            prev.handlerFiles = [...prev.handlerFiles, file];
          }

          return prev;
        },
        {
          schemaFiles: [],
          handlerFiles: [],
        }
      );

    /**
     * Iterate thru handler source files and derive schemas that are set as
     * typ params, such as `const FooHandler: Handler<AppCtx, ReqSchema, ResSchema> = ...`
     *
     * These schemas will be used (if any) unless a schema is specifically set in handlers
     * exported Route props.
     */
    for (const handlerFile of handlerFiles) {
      const [, filename] = handlerFile.fileName.split(handlersPath + sep);
      this.assumedSchemas.set(
        filename,
        getSchemaFromHandlerSourceFile(program, handlerFile)
      );
    }

    const onlySchemaFilenames = schemaFiles.map((sf) => sf.fileName);

    const generatedSchemas = TJS.generateSchema(
      program,
      "*",
      settings,
      onlySchemaFilenames
    );

    if (generatedSchemas && generatedSchemas.definitions) {
      await fsPromises.mkdir(join("generated", "schemas"), {
        recursive: true,
      });

      const schemaNames = Object.keys(generatedSchemas.definitions);

      log.info(`Generated ${schemaNames.length} schemas`);

      this.schemas = generatedSchemas.definitions as {
        [key: string]: TJS.Definition;
      };
    }
  }

  /**
   * Get http method from props or convention based on file name
   * if it starts with i.e "GetFoo"
   */
  private getHttpMethodForHandler(props: RouteProps, handlerFilename: string) {
    if (props.method) {
      return props.method;
    }

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
   * Constructs the app context. Will set context on all components
   * except for handlers which are handled in later stage.
   */
  private async buildContext() {
    const repoFns = await fsPromises.readdir("src/repos");

    const repos: { [x: string]: FlinkRepo<C> } = {};

    if (this.dbOpts) {
      for (const fn of repoFns) {
        const repoInstanceName = this.getRepoInstanceName(fn);
        const { default: Repo } = await this.loader("./repos/" + fn);
        const repoInstance: FlinkRepo<C> = new Repo(
          getCollectionNameForRepo(fn),
          this.db
        );

        repos[repoInstanceName] = repoInstance;
        log.info(`Registered repo ${repoInstanceName}`);
      }
    } else if (repoFns.length > 0) {
      log.warn(
        "No db configured but found repo(s) in src/repos: " + repoFns.join(", ")
      );
    }

    this.ctx = {
      repos,
    } as C;

    Object.keys(repos).map((repoName) => {
      repos[repoName].ctx = this.ctx!;
    });
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
}
