import express, { Express } from "express";
import { promises as fsPromises } from "fs";
import mongodb, { Db } from "mongodb";
import log from "node-color-log";
import { join, resolve } from "path";
import * as TJS from "typescript-json-schema";
import { v4 } from "uuid";
import FlitContext from "./FlitContext";
import FlitRepo from "./FlitRepo";
import { HandlerFn, HttpMethod, RouteProps } from "./HttpHandler";
import folderHash from "folder-hash";
import Ajv from "ajv";
import { isError, isRouteMatch } from "./FlitUtils";
import generateMockData from "./FlitMockDataGenerator";

const ajv = new Ajv();

interface FlitOptions {
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
        uri: string;
    };

    /**
     * Optional debug options, used to log and debug Flit internals.
     */
    debug?: boolean;

    /**
     * If API should respond with mock data based on response JSON schemas.
     * Either set `true` to mock all or provide array with routes that
     * should be mocked.
     */
    mockApi?: true | { method: HttpMethod, path: string }[]
}

class Flit<C extends FlitContext> {
    name: string;
    enableApiDocs: boolean;
    port?: number;
    app?: Express;
    schemas: { [x: string]: TJS.Definition } = {};
    ctx?: C;
    dbOpts?: FlitOptions["db"];
    db?: Db;
    debug = false;
    mockApiOpts: FlitOptions["mockApi"];

    constructor(opts: FlitOptions) {
        this.name = opts.name;
        this.enableApiDocs =
            typeof opts.enableApiDocs === "undefined" ? true : opts.enableApiDocs;
        this.port = opts.port || 3333;
        this.dbOpts = opts.db;
        this.debug = !!opts.debug;
        this.mockApiOpts = opts.mockApi;
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
                `Register JSON schemas took ${Date.now() - offsetTime} ms`
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
        const handlers = await fsPromises.readdir("src/handlers");

        const app = this.app!;

        for (const handler of handlers) {
            if (handler.endsWith(".ts")) {
                const { default: oHandlerFn, Route } = await import(
                    "../handlers/" + handler
                );

                const handlerFn: HandlerFn<C> = oHandlerFn;
                const props: RouteProps = Route;

                if (!props) {
                    log.error(`Missing Props in handler ${handler}`);
                    continue;
                }

                if (!this.ctx) {
                    throw new Error(
                        "Context does not exist (yet), make sure to build context prior to registering handlers"
                    );
                }

                const method = this.getHttpMethodForHandler(props, handler);

                if (method) {
                    app[method](props.path, async (req, res) => {

                        if (props.reqSchema) {
                            const schema = this.schemas[props.reqSchema];

                            if (!schema) {
                                log.error(`Missing request schema ${props.reqSchema} for handler ${handler} - skipping validation`);
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
                                            detail: `Schema ${props.reqSchema} did not validate ${JSON.stringify(validate.errors)}`
                                        }
                                    });
                                }
                            }
                        }

                        if (this.mockApiOpts && props.resSchema) {
                            const shouldMock = !Array.isArray(this.mockApiOpts) || isRouteMatch(req, this.mockApiOpts);

                            if (shouldMock) {
                                log.warn(`Mock response for ${req.method.toUpperCase()} ${req.path}`);
                                const schema = this.getSchema(props.resSchema);

                                if (schema) {
                                    const data = generateMockData(schema);
                                    res.status(200).json({
                                        status: 200,
                                        data
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
                                log.error(`Missing response schema ${props.resSchema} for handler ${handler} - skipping validation`);
                            } else {
                                const validate = ajv.compile(schema);
                                const valid = validate(handlerRes.data);

                                if (!valid) {
                                    log.warn(`Bad response ${JSON.stringify(validate.errors, null, 2)}`);
                                    log.debug(JSON.stringify(schema, null, 2));

                                    return res.status(500).json({
                                        status: 500,
                                        error: {
                                            id: v4(),
                                            title: "Bad response",
                                            detail: `Schema ${props.resSchema} did not validate ${JSON.stringify(validate.errors)}`
                                        }
                                    });
                                }
                            }
                        }

                        res.status(handlerRes.status || 200).json(handlerRes);
                    });

                    log.info(
                        `Registered handler ${handler} - ${method.toUpperCase()} ${props.path
                        }`
                    );
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
        const schemasPath = join("src", "schemas");
        const schemasCache = join("generated", "schemas");
        const schemasCacheHashFile = join(schemasCache, ".hash");

        const { hash } = await folderHash.hashElement(schemasPath);
        let lastHash = "";

        try {
            lastHash = await fsPromises.readFile(schemasCacheHashFile, "utf-8");
        } catch (err) { }

        if (lastHash === hash && 1 > 2 /* Remove this later on! */) {
            // TODO: This is not implemented beyond checking hash 
            log.info("Schema has not changed, using cached schemas");
            return;
        } else {
            fsPromises.writeFile(schemasCacheHashFile, hash);

            const schemas = await fsPromises.readdir(schemasPath);

            const program = TJS.getProgramFromFiles(
                schemas.map((filename) => resolve(join(schemasPath, filename))),
                {}
            );

            const settings: TJS.PartialArgs = {
                required: true,
                ref: false,
                noExtraProps: true,
            };

            const generatedSchemas = TJS.generateSchema(program, "*", settings);

            if (generatedSchemas && generatedSchemas.definitions) {
                await fsPromises.mkdir(join("generated", "schemas"), {
                    recursive: true,
                });

                const schemaNames = Object.keys(generatedSchemas.definitions);

                await fsPromises.writeFile(
                    join("generated", "schemas", "Schemas.ts"),
                    `export type Schemas = ${schemaNames
                        .map((sn) => `"${sn}"`)
                        .join(" | ")};`
                );

                log.info(`Generated ${schemaNames.length} schemas`);

                this.schemas = generatedSchemas.definitions as {
                    [key: string]: TJS.Definition;
                };
            }
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

        const repos: { [x: string]: FlitRepo<C> } = {};

        if (this.dbOpts) {
            for (const fn of repoFns) {
                const repoInstanceName = this.getRepoInstanceName(fn);
                const { default: Repo } = await import("../repos/" + fn);
                const repoInstance: FlitRepo<C> = new Repo("foo", this.db);

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

    private async initDb() {
        if (this.dbOpts) {
            try {
                const client = await mongodb.connect(this.dbOpts.uri, {
                    useUnifiedTopology: true,
                });
                this.db = client.db();
            } catch (err) {
                log.error("Failed to connect to db: " + err);
                process.exit(1);
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
            log.error(`Missing schema '${schemaName}'`)
        }

        return schema;
    }
}

export default Flit;
