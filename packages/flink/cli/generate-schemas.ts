#!/usr/bin/env node
import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { join } from "path";
import {
  createFormatter,
  createParser,
  SchemaGenerator,
} from "ts-json-schema-generator";
import { Project, SyntaxKind, ts } from "ts-morph";
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
      $ flink generate-schemas <dir> --types-dir <types-dir> --out-file <out-file>

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

  const verbose = getOption(args, "verbose", false, {
    isBoolean: true,
  }) as boolean;

  const typesDir = getOption(args, "types-dir", "./src/schemas") as string;

  const outFile = getOption(
    args,
    "out-file",
    "./.flink/generated-schemas.json"
  ) as string;

  const project = new Project({
    tsConfigFilePath: join(dir, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      noEmit: true,
    },
  });

  project.addSourceFilesAtPaths(join(dir, typesDir, "**/*.ts"));

  console.log("Found", project.getSourceFiles().length, "files");

  const schemaDeclarations: ts.Node[] = [];

  const generator = initJsonSchemaGenerator(project);

  const jsonSchemas: JSONSchema7[] = [];

  for (const sf of project.getSourceFiles()) {
    if (sf.getDefaultExportSymbol()) {
      console.warn(
        `WARN: Schema file ${sf.getBaseName()} has default export, but only named exports are picked up by json schemas parser`
      );
    }

    const sourceFileInterfaceDeclarations = sf.getChildrenOfKind(
      SyntaxKind.InterfaceDeclaration
    );

    const sourceFileEnumDeclarations = sf.getChildrenOfKind(
      SyntaxKind.EnumDeclaration
    );

    const sourceFileDeclarations = [
      ...sourceFileEnumDeclarations,
      ...sourceFileInterfaceDeclarations,
    ];

    schemaDeclarations.push(
      ...sourceFileDeclarations.map((d) => d.compilerNode)
    );

    verbose &&
      console.log(
        "Found",
        sourceFileDeclarations.length,
        "schema(s) in file",
        sf.getBaseName()
      );

    try {
      const schema = generator.createSchemaFromNodes(
        sourceFileInterfaceDeclarations.map((d) => d.compilerNode)
      );
      jsonSchemas.push(schema);
      // console.log("Created schemas");
    } catch (err) {
      console.error(
        "Failed to generate schema in file",
        sf.getBaseName() + ":",
        err
      );
    }
  }

  const mergedSchemas = jsonSchemas.reduce(
    (out, schema) => {
      if (schema)
        if (schema.definitions) {
          out.definitions = { ...out.definitions, ...schema.definitions };
        }
      return out;
    },
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      $ref: "#/definitions/Schemas",
      definitions: {},
    }
  );

  const file = join(dir, outFile);

  await writeJsonFile(file, mergedSchemas, {
    ensureDir: true,
  });

  console.log("Wrote file", file);
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
