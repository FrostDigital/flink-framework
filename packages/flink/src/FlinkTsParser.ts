import { promises as fsPromises } from "fs";
import mkdirp from "mkdirp";
import { join } from "path";
import { Project } from "ts-morph";
import * as TJS from "typescript-json-schema";
import { log } from "./FlinkLog";
import { getHandlerFiles, getSchemaFiles } from "./utils";

const flinkDir = ".flink";

export async function parseSourceFiles(appRoot = "./") {
  // List all schema and handler files
  const handlers = await getHandlerFiles(appRoot);
  const schemas = await getSchemaFiles(appRoot);

  if (!schemas.length && !handlers.length) {
    // log.warn("No schemas nor handlers found");
    return;
  }

  const programFiles: string[] = [];

  if (schemas.length) {
    programFiles.push(...schemas);
  }

  if (handlers.length) {
    programFiles.push(...handlers);
  }

  const tsProject = new Project({
    compilerOptions: {
      esModuleInterop: true,
      skipLibCheck: true, // Mainly due to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/46639
    },
  });

  tsProject.addSourceFilesAtPaths(programFiles);

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

  const generatedSchemas = TJS.generateSchema(
    schemaProgram,
    "*",
    settings
    // onlySchemaFilenames
  );

  if (generatedSchemas && generatedSchemas.definitions) {
    await fsPromises.mkdir(join("generated", "schemas"), {
      recursive: true,
    });

    const schemaNames = Object.keys(generatedSchemas.definitions);

    log.info(`Generated ${schemaNames.length} schemas`);

    await writeParsedSchemas(generatedSchemas);
  }
}

async function writeParsedSchemas(schemas: any) {
  await mkdirp(flinkDir);

  return fsPromises.writeFile(
    join(flinkDir, "schemas.json"),
    JSON.stringify(schemas, null, 2)
  );
}

async function writeParsedHandlers(handlers: any) {
  await mkdirp(flinkDir);

  return fsPromises.writeFile(
    join(flinkDir, "handlers.json"),
    JSON.stringify(handlers, null, 2)
  );
}

export async function parseHandlers() {}
