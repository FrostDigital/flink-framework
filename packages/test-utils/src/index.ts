import { FlinkApp, FlinkResponse } from "@flink-app/flink";
import got, { GotJSONOptions } from "got";
import qs from "qs";

let app: FlinkApp<any>;
let baseUrl: string;

const gotOpts: GotJSONOptions = {
    throwHttpErrors: false,
    json: true,
    retry: 0,
};

export type HttpOpts = {
    qs?: { [x: string]: string | string[] };
    headers?: { [x: string]: string };
};

/**
 * Initializes test flink app.
 * Should be invoked prior to using test methods.
 */
export function init(_app: FlinkApp<any>, host = "localhost") {
    app = _app;
    baseUrl = `http://${host}:${app.port}`;
}

export async function get<Res = any>(path: string, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();
    const res = await got.get(getUrl(path, opts.qs), {
        ...gotOpts,
        headers: opts.headers,
    });
    return {
        status: res.statusCode,
        ...res.body,
    };
}

export async function post<Req = any, Res = any>(path: string, body: Req, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();
    const res = await got.post(getUrl(path, opts.qs), {
        ...gotOpts,
        body: body as any,
        headers: opts.headers,
    });

    return {
        status: res.statusCode,
        ...res.body,
    };
}

export async function put<Req = any, Res = any>(path: string, body: Req, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();
    const res = await got.put(getUrl(path, opts.qs), {
        ...gotOpts,
        body: body as any,
        headers: opts.headers,
    });
    return {
        status: res.statusCode,
        ...res.body,
    };
}

export async function del<Res = any>(path: string, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();
    const res = await got.delete(getUrl(path, opts.qs), {
        ...gotOpts,
        headers: opts.headers,
    });
    return {
        status: res.statusCode,
        ...res.body,
    };
}

function validateApp() {
    if (!app) {
        throw new Error("App not initialized, run `init(app)` prior to invoking get/post/put/del");
    }
}

function getUrl(path: string, queryString?: HttpOpts["qs"]) {
    if (queryString) {
        return baseUrl + path + "?" + qs.stringify(queryString);
    }
    return baseUrl + path;
}
