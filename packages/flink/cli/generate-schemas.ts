#!/usr/bin/env node
import { join } from "path";
import {
  createFormatter,
  createParser,
  SchemaGenerator,
} from "ts-json-schema-generator";
import { Project } from "ts-morph";
import { writeJsonFile } from "../src/FsUtils";
import { getOption } from "./cli-utils";

module.exports = async function run(args: string[]) {
  if (args.includes("--help")) {
    console.log(`
    Description
      Generates JSON schemas for types located in schemas directory or if any other directory
      is specified with option --types-dir. 

      Outputs generated file(s) to dir '.flink' or if any other --out-dir is specified.

    Usage
      $ flink generate-schemas <dir> --types-dir <types-dir> --out-dir <out-dir>

      <dir> is project root as directory where tsconfig.son resides.
       
    Options            
      --types-dir   Directory where typescript types are located relative to <dir>, default "./src/schemas"
      --out-file    Path to file that will contain generated json schemas relative to <dir>, default "./.flink/generated-schemas.json"
      --help        Displays this message
      `);

    process.exit(0);
  }

  let dir = "./";
  if (args[0] && !args[0].startsWith("--")) {
    dir = args[0];
  }

  const typesDir = getOption(args, "types-dir", "./src/schemas") as string;
  const outFile = getOption(args, "out-file", "./.flink") as string;

  const project = new Project({
    tsConfigFilePath: join(dir, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      noEmit: true,
    },
  });

  project.addSourceFilesAtPaths(join(dir, typesDir, "**/*.ts"));

  console.log("Found", project.getSourceFiles().length, "files");

  for (const sf of project.getSourceFiles()) {
    if (sf.getDefaultExportSymbol()) {
      console.warn(
        `WARN: Schema file ${sf.getBaseName()} has default export, but only named exports are picked up by json schemas parser`
      );
    }
  }

  const generator = initJsonSchemaGenerator(project);
  const schemas = generator.createSchema("*");

  await writeJsonFile(join(dir, outFile), schemas, {
    ensureDir: true,
  });
};

function initJsonSchemaGenerator(project: Project) {
  const formatter = createFormatter({});
  const parser = createParser(project.getProgram().compilerObject, {});
  const generator = new SchemaGenerator(
    project.getProgram().compilerObject,
    parser,
    formatter,
    { expose: "export" }
  );

  return generator;
}
