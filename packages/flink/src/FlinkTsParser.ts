import { promises as fsPromises } from "fs";
import mkdirp from "mkdirp";
import { join } from "path";
import { Project } from "ts-morph";
import * as TJS from "typescript-json-schema";
import { HandlerConfig } from "./FlinkApp";
import { log } from "./FlinkLog";
import {
  getRoutePropsFromHandlerSourceFile,
  getSchemaFromHandlerSourceFile,
} from "./TypeScriptUtils";
import { getHandlerFiles, getSchemaFiles } from "./utils";

const flinkDir = ".flink";

export async function parseSourceFiles(appRoot = "./") {
  const schemas = await parseSchemas(appRoot);
  const handlers = await parseHandlers(appRoot, schemas || {});
  await writeParsedHandlers(handlers);
}

export async function parseAndWriteSchemas(appRoot = "./") {
  const schemas = await parseSchemas(appRoot);
  await writeParsedSchemas(schemas);
}

async function parseHandlers(
  appRoot: string,
  schemas: { [x: string]: TJS.Definition }
) {
  const handlers = await getHandlerFiles(appRoot);

  if (!handlers.length) {
    return;
  }

  const tsProject = new Project({
    compilerOptions: {
      esModuleInterop: true,
      skipLibCheck: true, // Mainly due to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/46639
    },
  });

  tsProject.addSourceFilesAtPaths(handlers);

  /**
   * Iterate thru handler source files and derive schemas that are set as
   * typ params, such as `const FooHandler: Handler<AppCtx, ReqSchema, ResSchema> = ...`
   *
   * These schemas will be used (if any) unless a schema is specifically set in handlers
   * exported Route props.
   */
  const handlerConfigs: HandlerConfig[] = tsProject
    .getSourceFiles()
    .map((handlerFile) => {
      const [, handlerRelativeName] = handlerFile
        .getFilePath()
        .split("src/handlers/");

      const schema = getSchemaFromHandlerSourceFile(handlerFile);

      return {
        schema: {
          reqSchema: schema.reqSchema ? schemas[schema.reqSchema] : undefined,
          resSchema: schema.resSchema ? schemas[schema.resSchema] : undefined,
        },
        routeProps: { ...getRoutePropsFromHandlerSourceFile(handlerFile) },
        origin: handlerRelativeName,
      };
    });

  return handlerConfigs;
}

async function parseSchemas(appRoot: string) {
  // List all schema and handler files
  const schemas = await getSchemaFiles(appRoot);

  if (!schemas.length) {
    // log.warn("No schemas nor handlers found");
    return;
  }

  const programFiles: string[] = [];

  if (schemas.length) {
    programFiles.push(...schemas);
  }

  const settings: TJS.PartialArgs = {
    required: true,
    ref: false,
    noExtraProps: true,
  };

  // TODO: Cannot get TJS to work with reusing same TS program (tsProject.getProgram().compilerObject). Creating new program but this should not be used
  const schemaProgram = TJS.getProgramFromFiles(
    schemas,
    {
      esModuleInterop: true,
      skipLibCheck: true, // Mainly due to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/46639
    },
    process.cwd()
  );

  const generatedSchemas = TJS.generateSchema(schemaProgram, "*", settings);

  if (generatedSchemas && generatedSchemas.definitions) {
    const schemaNames = Object.keys(generatedSchemas.definitions);
    log.info(`Generated ${schemaNames.length} schemas`);
    return generatedSchemas.definitions as { [key: string]: TJS.Definition };
  }
}

async function writeParsedHandlers(handlers: any) {
  await mkdirp(flinkDir);

  return fsPromises.writeFile(
    join(flinkDir, "handlers.json"),
    JSON.stringify(handlers, null, 2)
  );
}

async function writeParsedSchemas(schemas: any) {
  await mkdirp(flinkDir);

  return fsPromises.writeFile(
    join(flinkDir, "schemas.json"),
    JSON.stringify(schemas, null, 2)
  );
}
