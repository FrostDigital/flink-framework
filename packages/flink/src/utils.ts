import { Request } from "express";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";
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

/**
 * Recursively iterates thru json schema properties and replaces any $ref
 * with the actual definiton if it exists withing provided `jsonSchemas`.
 *
 * @param schemaToDeRef
 * @param jsonSchemas
 * @returns
 */
export function deRefSchema(
  schemaToDeRef: JSONSchema7Definition,
  jsonSchemas: JSONSchema7
) {
  if (typeof schemaToDeRef === "boolean") {
    return schemaToDeRef;
  }

  const theSchemaToDeRef = schemaToDeRef as JSONSchema7;

  if (theSchemaToDeRef.properties) {
    for (const k in theSchemaToDeRef.properties) {
      const prop = theSchemaToDeRef.properties[k];

      if (typeof prop !== "boolean" && prop.$ref) {
        const [_0, _1, defKey] = prop.$ref.split("/");
        const refedSchema = (jsonSchemas.definitions || {})[defKey];
        if (refedSchema) {
          theSchemaToDeRef.properties[k] = refedSchema;
          deRefSchema(refedSchema, jsonSchemas);
        } else {
          console.warn(`Failed to find deref ${prop.$ref}`);
        }
      }
    }
  }

  return theSchemaToDeRef;
}
