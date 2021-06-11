import { Request } from "express";
import { promises as fsPromises } from "fs";
import { join } from "path";
import { HttpMethod } from "./FlinkHttpHandler";
import { FlinkResponse } from "./FlinkResponse";
import tinyGlob from "tiny-glob";
import { log } from "./FlinkLog";

export function handlersPath(appRoot: string) {
  return join(appRoot, "src", "handlers");
}

export function schemasPath(appRoot: string) {
  return join(appRoot, "src", "schemas");
}

export function isRouteMatch(
  req: Request,
  routes: { method: HttpMethod; path: string }[]
) {
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
    return tinyGlob(`**/*.ts`, { cwd: handlersPath(appRoot) });
  } catch (err) {
    log.error(`Failed getting handler files: ${err}`);
    return [];
  }
}

export async function getSchemaFiles(appRoot: string) {
  try {
    return await fsPromises.readdir(schemasPath(appRoot));
  } catch (err) {
    return [];
  }
}

export function getCollectionNameForRepo(repoFilename: string) {
  return repoFilename.replace("Repo.ts", "").toLowerCase();
}
