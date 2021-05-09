import { Request } from "express";
import { promises as fsPromises } from "fs";
import { join } from "path";
import { HttpMethod } from "./FlinkHttpHandler";
import { FlinkResponse } from "./FlinkResponse";

export const handlersPath = join("src", "handlers");
export const schemasPath = join("src", "schemas");

export function isRouteMatch(req: Request, routes: { method: HttpMethod, path: string }[]) {
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

export async function getHandlerFiles() {
    try {
        return await fsPromises.readdir(handlersPath);
    } catch (err) {
        return [];
    }
}

export async function getSchemaFiles() {
    try {
        return await fsPromises.readdir(schemasPath);
    } catch (err) {
        return [];
    }
}


export function getCollectionNameForRepo(repoFilename: string) {
    return repoFilename.replace("Repo.ts", "").toLowerCase();
}