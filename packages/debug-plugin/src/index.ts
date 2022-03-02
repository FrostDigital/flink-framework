import { FlinkApp, FlinkPlugin, HttpMethod } from "@flink-app/flink";
import { ManagementApiModule, ManagementApiType } from "@flink-app/management-api-plugin";
import express from "express";
import log from "node-color-log";
import request from "./models/request";
import * as GetHandler from "./handlers/Debug/Get";
import * as PostDisableHandler from "./handlers/Debug/PostDisable";
import * as PostEnableHandler from "./handlers/Debug/PostEnable";

export type StaticOptions = {
    /**
     * Base url
     */
    logToConsole: boolean;
    enabledAtStart: boolean;
    keepLogs?: number;
};

export const debugPlugin = (options: StaticOptions): FlinkPlugin => {
    let requests: request[] = [];
    let enabled = options.enabledAtStart;
    return {
        id: "debugPlugin",
        init: (app) => init(app, options),

        ctx: {
            requests,
            enabled,
        },
    };
};

function init(app: FlinkApp<any>, options: StaticOptions) {
    const { expressApp } = app;
    let keep = 100;
    if (options.keepLogs != null) {
        keep = options.keepLogs;
    }
    if (!expressApp) {
        throw new Error("Express app not initialized");
    }

    if (options.enabledAtStart) {
        log.info(`Debug enabled`);
    }

    expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        let requests = app.ctx.plugins.debugPlugin.requests as request[];
        let enabled = app.ctx.plugins.debugPlugin.enabled as boolean;
        if (!enabled) {
            if (next) {
                next();
            }
            return;
        }
        if (req.originalUrl.startsWith("/managementapi")) {
            if (next) {
                next();
            }
            return;
        }
        let requestItem: request = {
            start: new Date(),
            method: req.method,
            path: req.originalUrl,
            body: req.body,
            headers: req.headers,
        };

        requests.unshift(requestItem);

        requests = requests.splice(0, keep);
        app.ctx.plugins.debugPlugin.requests = requests;
        let oldWrite = res.write;
        let oldEnd = res.end;
        const chunks: Buffer[] = [];

        (res.write as unknown) = function (chunk: any) {
            chunks.push(Buffer.from(chunk));
            (oldWrite as Function).apply(res, arguments);
        };

        res.end = function (chunk: any) {
            if (chunk) {
                chunks.push(Buffer.from(chunk));
            }
            const body = Buffer.concat(chunks).toString("utf8");
            requestItem.end = new Date();
            requestItem.response = body;
            if (options.logToConsole) {
                log.debug(requestItem);
            }
            (oldEnd as Function).apply(res, arguments);
        };
        if (next) {
            next();
        }
    });
}

export interface GetManagementModuleConfig {
    pluginId?: string;
    ui: boolean;
    uiSettings?: {
        title: string;
    };
}

export const GetManagementModule = (config: GetManagementModuleConfig): ManagementApiModule => {
    if (config.pluginId == null) config.pluginId = "debug";

    let endpoints: ManagementApiModule["endpoints"] = [];
    endpoints.push({
        routeProps: {
            path: "/",
            method: HttpMethod.get,
            origin: config.pluginId,
        },
        handler: GetHandler,
    });
    endpoints.push({
        routeProps: {
            path: "/enable",
            method: HttpMethod.post,
            origin: config.pluginId,
        },
        handler: PostEnableHandler,
    });
    endpoints.push({
        routeProps: {
            path: "/disable",
            method: HttpMethod.post,
            origin: config.pluginId,
        },
        handler: PostDisableHandler,
    });

    let features: string[] = [];

    let module: ManagementApiModule = {
        id: config.pluginId || "debug",
        uiSettings: {
            title: config.uiSettings?.title || "Debug",
            icon: "",
            features,
        },
        ui: config.ui,
        type: ManagementApiType.debug,
        endpoints: endpoints,
        data: {},
    };

    return module;
};
