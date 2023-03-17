import { Request } from "express";
import { join, sep } from "path";
import tinyGlob from "tiny-glob";
import { HttpMethod } from "./FlinkHttpHandler";
import { log } from "./FlinkLog";
import { FlinkResponse } from "./FlinkResponse";

export function handlersPath(appRoot: string) {
    return join(appRoot, "src", "handlers");
}

export function schemasPath(appRoot: string) {
    return join(appRoot, "src", "schemas");
}

export function isRouteMatch(req: Request, routes: { method: HttpMethod; path: string }[]) {
    const match = routes.find(({ method, path }) => {
        const sameMethod = req.method.toLowerCase() === method;
        const samePath = req.route.path === path;
        return sameMethod && samePath;
    });

    return !!match;
}

export function isError(message: FlinkResponse) {
    return message.status && message.status > 399;
}

export async function getHandlerFiles(appRoot: string) {
    try {
        return await tinyGlob(`**/*.ts`, {
            cwd: handlersPath(appRoot),
            absolute: true,
        });
    } catch (err) {
        log.debug(`Failed getting handler files: ${err}`);
        return [];
    }
}

export async function getSchemaFiles(appRoot: string) {
    try {
        return await tinyGlob(`**/*.ts`, {
            cwd: schemasPath(appRoot),
            absolute: true,
        });
    } catch (err) {
        return [];
    }
}

export function getCollectionNameForRepo(repoFilename: string) {
    return repoFilename.replace("Repo.ts", "").toLowerCase();
}

export function getRepoInstanceName(fn: string) {
    const [name] = fn.split(".ts");
    return name.charAt(0).toLowerCase() + name.substr(1);
}

/**
 * Get http method from props or convention based on file name
 * if it starts with i.e "GetFoo"
 */
export function getHttpMethodFromHandlerName(handlerFilename: string) {
    if (handlerFilename.includes(sep)) {
        const split = handlerFilename.split(sep);
        handlerFilename = split[split.length - 1];
    }

    handlerFilename = handlerFilename.toLocaleLowerCase();

    if (handlerFilename.startsWith(HttpMethod.get)) return HttpMethod.get;
    if (handlerFilename.startsWith(HttpMethod.post)) return HttpMethod.post;
    if (handlerFilename.startsWith(HttpMethod.put)) return HttpMethod.put;
    if (handlerFilename.startsWith(HttpMethod.delete)) return HttpMethod.delete;
}

export function getJsDocComment(comment: string) {
    const rows = comment.split("\n").map((line) => {
        line = line.trim();
        if (line.startsWith("//")) {
            return line.replace("//", line).trim();
        }
        return line.replace(/\/\*\*|\*\/|\*/, "").trim();
    });

    return rows.join("\n").trim();
}

const pathParamsRegex = /:([a-zA-Z0-9]+)/g;

/**
 * Returns array of path params from path string.
 * For example `/user/:id` will return `["id"]`
 * @param path
 * @returns
 */
export function getPathParams(path: string) {
    return path.match(pathParamsRegex)?.map((match) => match.slice(1)) || [];
}
