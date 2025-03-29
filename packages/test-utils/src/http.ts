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
    /***
     * Optional query string
     */
    qs?: { [x: string]: string | string[] };
    /**
     * Optional headers
     */
    headers?: { [x: string]: string };
    /**
     * Optional user object to be used for authentication.
     *
     * An auth plugin must be set in the app for this to work. Most likely the auth plugin
     * is a mock auth plugin in test scenarios.
     */
    user?: any & { roles: string[] };
};

/**
 * Initializes test flink app.
 * Must be invoked prior to using test HTTP methods.
 */
export function init(_app: FlinkApp<any>, host = "localhost") {
    app = _app;
    baseUrl = `http://${host}:${app.port}`;
}

export async function get<Res = any>(path: string, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();

    const headers = await setAuthHeader(opts.user, opts.headers);

    const res = await got.get(getUrl(path, opts.qs), {
        ...gotOpts,
        headers,
    });
    return {
        status: res.statusCode,
        ...res.body,
    };
}

export async function post<Req = any, Res = any>(path: string, body: Req, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();

    const headers = await setAuthHeader(opts.user, opts.headers);

    try {
        const res = await got.post(getUrl(path, opts.qs), {
            ...gotOpts,
            body: body as any,
            headers,
        });

        return {
            status: res.statusCode,
            ...res.body,
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function put<Req = any, Res = any>(path: string, body: Req, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();

    const headers = await setAuthHeader(opts.user, opts.headers);

    const res = await got.put(getUrl(path, opts.qs), {
        ...gotOpts,
        body: body as any,
        headers,
    });
    return {
        status: res.statusCode,
        ...res.body,
    };
}

export async function del<Res = any>(path: string, opts: HttpOpts = {}): Promise<FlinkResponse<Res>> {
    validateApp();

    const headers = await setAuthHeader(opts.user, opts.headers);

    const res = await got.delete(getUrl(path, opts.qs), {
        ...gotOpts,
        headers,
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

async function setAuthHeader(user?: any, headers?: HttpOpts["headers"]) {
    if (!user) return headers;

    headers = headers || {};

    if (!app.auth) {
        throw new Error("Auth plugin not set, cannot use user option");
    }
    const token = await app.auth.createToken(user, user.roles || []);
    headers["Authorization"] = `Bearer ${token}`;
    return headers;
}
