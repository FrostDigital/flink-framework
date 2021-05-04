import express, { Express } from "express";
import { promises as fsPromises } from "fs";
import HttpHandler from "./HttpHandler";
import uuid from "uuid";

interface FlitOptions {
    /**
     * Name of application, will only show in logs and in HTTP header.
     */
    name: string;

    /**
     * If to enable API documentation based on JSON schemas.     
     * @default true
     */
    enableApiDocs?: boolean;

    /**
    * HTTP port
    * @default 3333
    */
    port?: number;
}


class Flit {
    name: string;
    enableApiDocs: boolean;
    port?: number;
    app?: Express;

    constructor(opts: FlitOptions) {
        this.name = opts.name;
        this.enableApiDocs = typeof opts.enableApiDocs === "undefined" ? true : opts.enableApiDocs;
        this.port = opts.port || 3333;
    }

    start() {
        this.app = express();

        this.app.use((req, res, next) => {
            req.reqId = uuid.v4();
            next();
        });

        this.registerHandlers();

        this.app.listen(this.port, () => {
            console.log(`🟢 HTTP server '${this.name}' is running and waiting for connections on ${this.port}`)
        });
    }

    async registerHandlers() {
        const handlers = await fsPromises.readdir("src/handlers");

        const app = this.app!;

        for (const handler of handlers) {
            if (handler.endsWith(".ts")) {
                const Handler = (await import("../handlers/" + handler)).default;

                const h: HttpHandler = new Handler();

                app[h.method](h.path, async (req, res) => {
                    const handlerRes = await h.handleHttp(req);
                    res.status(handlerRes.status || 200).json(handlerRes);
                });

                console.log(`Registered handler ${handler}, ${h.method} ${h.path}`);
            }
        }
    }
}


export default Flit;