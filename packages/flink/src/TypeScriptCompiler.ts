import { promises as fsPromises } from "fs";
import { join } from "path";
import glob from "tiny-glob";
import {
  createFormatter,
  createParser,
  Schema,
  SchemaGenerator,
} from "ts-json-schema-generator";
import {
  ArrayLiteralExpression,
  DiagnosticCategory,
  ImportDeclarationStructure,
  OptionalKind,
  Project,
  SourceFile,
  Symbol,
  SyntaxKind,
  ts,
  Type,
  TypeReferenceNode,
} from "ts-morph";
import {
  addImport,
  getDefaultExport,
  getTypesToImport,
} from "./TypeScriptUtils";
import {
  getCollectionNameForRepo,
  getHttpMethodFromHandlerName,
  getRepoInstanceName,
} from "./utils";

class TypeScriptCompiler {
  private project: Project;
  private schemaGenerator?: SchemaGenerator;

  /**
   * Parsed typescript schemas that will be added to intermediate
   * schemas.ts file.
   *
   * This will be written to file in a batch for performance reasons.
   */
  private parsedTsSchemas: string[] = [];

  /**
   * Imports needed for schemas.ts.
   *
   * This will be added to file in a batch for performance reasons.
   */
  private tsSchemasSymbolsToImports: Symbol[] = [];

  constructor(private cwd: string) {
    this.project = new Project({
      tsConfigFilePath: join(cwd, "tsconfig.json"),
      compilerOptions: {
        noEmit: false,
        outDir: join(cwd, "dist"),
        // incremental: true,
      },
    });

    console.log(
      "Loaded",
      this.project.getSourceFiles().length,
      "source file(s) from",
      cwd
    );
  }

  /**
   * Deletes all generated files.
   * @param cwd
   */
  static async clean(cwd: string) {
    const flinkDir = join(cwd, ".flink");

    try {
      await fsPromises.access(flinkDir);
    } catch (err) {
      await fsPromises.mkdir(flinkDir);
    }

    const files = await glob(".flink/**/*.ts", { cwd });
    for (const file of files) {
      await fsPromises.rm(join(cwd, file));
    }

    return flinkDir;
  }

  /**
   * Emits compiled javascript source to dist folder
   */
  emit() {
    this.project.emitSync();
  }

  /**
   * Catch any compilation errors. Will return false if any Errors
   * exists. Warnings will be passed thru but logged.
   */
  getPreEmitDiagnostics() {
    const preEmitDiag = this.project.getPreEmitDiagnostics();

    if (preEmitDiag.length > 0) {
      let hasError = false;

      for (const diag of preEmitDiag) {
        if (diag.getCategory() === DiagnosticCategory.Error) {
          console.error(
            `[ERROR] ${diag.getSourceFile()?.getBaseName()}:`,
            diag.getMessageText()
          );
          hasError = true;
        }
        if (diag.getCategory() === DiagnosticCategory.Warning) {
          console.warn(
            `[WARNING] ${diag.getSourceFile()?.getBaseName()}:`,
            diag.getMessageText()
          );
        }
      }

      if (hasError) {
        return false;
      }
    }
    return true;
  }

  /**
   * Scans project for handlers and add those to Flink
   * "singleton" property `scannedHandlers` so they can
   * be registered during start.
   *
   * Also extract handlers request and response schemas from Handler
   * type arguments.
   */
  async parseHandlers(excludeDirs: string[] = []) {
    const generatedFile = this.createSourceFile(
      ["generatedHandlers.ts"],
      `// Generated ${new Date()}
import { scannedHandlers, HttpMethod } from "@flink-app/flink";
export const handlers = [];
scannedHandlers.push(...handlers);
    `
    );
    const handlersArr = generatedFile
      .getVariableDeclarationOrThrow("handlers")
      .getFirstDescendantByKindOrThrow(SyntaxKind.ArrayLiteralExpression);

    const autoRegHandlers = await this.parseAutoRegisteredHandlers(
      generatedFile,
      handlersArr
    );

    const manualRegHandlers = await this.parseManuallyRegisteredHandlers(
      excludeDirs
    );

    generatedFile.addImportDeclarations(autoRegHandlers.imports);

    await generatedFile.save();

    this.createIntermediateSchemaFile();

    await this.generateAndSaveJsonSchemas([
      ...autoRegHandlers.schemasToGenerate,
      ...manualRegHandlers.schemasToGenerate,
    ]);

    return generatedFile;
  }

  /**
   * Scan `/src/handlers/*.ts` for handlers that are eligible
   * for auto registration.
   */
  private async parseAutoRegisteredHandlers(
    generatedFile: SourceFile,
    handlersArr: ArrayLiteralExpression
  ) {
    const imports: OptionalKind<ImportDeclarationStructure>[] = [];
    let i = 0;
    const schemasToGenerate: {
      reqSchemaType?: string;
      resSchemaType?: string;
    }[] = [];

    for (const sf of this.project.getSourceFiles()) {
      if (
        !sf.getFilePath().includes("src/handlers/") ||
        !sf.getVariableDeclaration("Route")
      ) {
        continue;
      }

      console.log(`Detected handler ${sf.getBaseName()}`);

      const namespaceImport =
        sf.getBaseNameWithoutExtension().replaceAll(".", "_") + "_" + i;

      imports.push({
        namespaceImport,
        moduleSpecifier: generatedFile.getRelativePathAsModuleSpecifierTo(sf),
      });

      const assumedHttpMethod = getHttpMethodFromHandlerName(sf.getBaseName());

      const schemaTypes = await this.extractSchemasFromHandlerSourceFile(sf);

      handlersArr.insertElement(
        i,
        `{routeProps: ${namespaceImport}.Route, handlerFn: ${namespaceImport}.default, assumedHttpMethod: ${
          assumedHttpMethod ? "HttpMethod." + assumedHttpMethod : undefined
        }, reqSchema: "${schemaTypes?.reqSchemaType || ""}", resSchema: "${
          schemaTypes?.resSchemaType || ""
        }"}`
      );

      schemasToGenerate.push(schemaTypes || {});

      i++;
    }

    return {
      imports,
      schemasToGenerate,
    };
  }

  /**
   * Parse handlers added using `app.addHandler(...)`
   */
  private async parseManuallyRegisteredHandlers(excludeDirs: string[]) {
    const schemasToGenerate: {
      reqSchemaType?: string;
      resSchemaType?: string;
    }[] = [];

    for (const sf of this.project.getSourceFiles()) {
      if (excludeDirs.find((dir) => sf.getFilePath().startsWith(dir))) {
        continue;
      }

      // Search all files for `addHandler` invocations
      // TODO: Additional filtering needed? As now any method named addHandler will be picked up.
      const addHandlerCallExpressions = sf
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter(
          (node) =>
            node
              .getFirstDescendantByKind(SyntaxKind.PropertyAccessExpression)
              ?.getName() === "addHandler"
        );

      for (const callExp of addHandlerCallExpressions) {
        const [_propsArg, handlerArg] = callExp.getArguments();

        const handlerSymbol =
          handlerArg.getSymbolOrThrow().getAliasedSymbol() ||
          handlerArg.getSymbolOrThrow();

        const typeRef = handlerSymbol
          .getValueDeclarationOrThrow()
          .getFirstDescendantByKind(SyntaxKind.TypeReference);

        if (typeRef) {
          const snippet = callExp
            .getText()
            .replaceAll(/ |\n|\r|\t/g, "")
            .substr(0, 50);
          console.log(
            `Detected handler in file ${sf.getBaseName()} (line ${typeRef.getStartLineNumber()}): ${snippet}...`
          );

          // Extract schema type from handler fn
          const schemas = await this.extractSchemaTypeFromHandler(typeRef);

          schemasToGenerate.push(schemas);

          // Add name of schema type to invocation so we, at runtime, knows which schema to use
          callExp.insertArgument(
            2,
            `{reqSchema: "${schemas.reqSchemaType}", resSchema: "${schemas.resSchemaType}"}`
          );
        }
      }
    }

    return { schemasToGenerate };
  }

  async parseRepos() {
    const generatedFile = this.createSourceFile(
      ["generatedRepos.ts"],
      `// Generated ${new Date()}
  import { scannedRepos } from "@flink-app/flink";
  export const repos = [];
  scannedRepos.push(...repos);
      `
    );

    const reposArr = generatedFile
      .getVariableDeclarationOrThrow("repos")
      .getFirstDescendantByKindOrThrow(SyntaxKind.ArrayLiteralExpression);

    const imports: OptionalKind<ImportDeclarationStructure>[] = [];

    let i = 0;

    for (const sf of this.project.getSourceFiles()) {
      if (!sf.getFilePath().includes("src/repos/")) {
        continue;
      }

      console.log(`Detected repo ${sf.getBaseName()}`);

      imports.push({
        defaultImport: sf.getBaseNameWithoutExtension(),
        moduleSpecifier: generatedFile.getRelativePathAsModuleSpecifierTo(sf),
      });

      reposArr.insertElement(
        i,
        `{collectionName: "${getCollectionNameForRepo(
          sf.getBaseName()
        )}", repoInstanceName: "${getRepoInstanceName(
          sf.getBaseName()
        )}", Repo: ${sf.getBaseNameWithoutExtension()}}`
      );

      i++;
    }

    generatedFile.addImportDeclarations(imports);

    await generatedFile.save();

    return generatedFile;
  }

  /**
   * Generates a start script that will import references to handlers, repos and the
   * actual Flink app to start.
   *
   * Note that order is of importance so generated metadata are imported and initialized before start of flink app.
   * Otherwise singletons `scannedRepos` and `scannedHandlers` will not have been set.
   */
  async generateStartScript(appEntryScript = "/src/index.ts") {
    if (
      !this.project.getSourceFile((sf) =>
        sf.getFilePath().endsWith(appEntryScript)
      )
    ) {
      console.error(`Cannot find entry script '${appEntryScript}'`);
      return process.exit(1);
    }

    const sf = this.createSourceFile(
      ["start.ts"],
      `// Generated ${new Date()}
import "./generatedHandlers";
import "./generatedRepos";
import "..${appEntryScript.replaceAll(".ts", "")}";
`
    );

    await sf.save();

    return sf;
  }

  private createSourceFile(filename: string[], contents: string) {
    return this.project.createSourceFile(
      join(this.cwd, ".flink", ...filename),
      contents,
      {
        overwrite: true,
      }
    );
  }

  /**
   * Parses handlers `Handler<...>` function and its type arguments to extract
   * which schemas to use.
   *
   * There are multiple ways of defining schema types as valid ts and this
   * implementation aims to support all of these.
   *
   * Some examples of different cases (check spec/mock-project/src/handlers for more):
   *
   * ```
   * // Interface reference
   * Handler<Ctx, Car>
   * // Inline type definition with reference to interface
   * Handler<Ctx, {car: Car}>
   * // Inline type definition with literal values
   * Handler<Ctx, {car: {model: string}}>
   * // Array
   * Handler<Ctx, Car[]>
   * // Array with inline type definition
   * Handler<Ctx, {car: Car}[]>
   * ```
   */
  private async extractSchemasFromHandlerSourceFile(
    handlerSourceFile: SourceFile
  ) {
    const defaultExport = getDefaultExport(handlerSourceFile);

    if (defaultExport) {
      const handlerTypeRef = defaultExport.getFirstDescendantByKindOrThrow(
        SyntaxKind.TypeReference
      );

      return this.extractSchemaTypeFromHandler(handlerTypeRef);
    } else {
      console.warn(
        `Handler ${handlerSourceFile.getBaseName()} is missing default exported handler function`
      );
    }
  }

  private async saveIntermediateTsSchema(
    schema: Type<ts.Type>,
    handlerFile: SourceFile,
    suffix: string
  ) {
    if (schema.isAny()) {
      return; // 'any' indicates that no schema is used
    }

    const handlerFileName = handlerFile
      .getBaseNameWithoutExtension()
      .replaceAll(".", "_");

    let generatedSchemaInterfaceStr = "";

    const schemaInterfaceName = `${handlerFileName}_${suffix}`;

    if (schema.isInterface()) {
      /*
       * Type argument is an interface. This should be normal case when
       * schema is defined directly for example `Handler<Ctx, Car>`
       */
      const schemaSymbol = schema.getSymbolOrThrow();
      const interfaceName = schemaSymbol.getEscapedName();
      const declaration = schemaSymbol.getDeclarations()[0];

      if (declaration.getSourceFile() === handlerFile) {
        // Interface is declared within handler file
        generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} {          
          ${schema
            .getProperties()
            .map((p) => p.getValueDeclarationOrThrow().getText())
            .join("\n")}
        }`;

        for (const typeToImport of getTypesToImport(declaration)) {
          this.tsSchemasSymbolsToImports.push(
            typeToImport.getSymbolOrThrow().getDeclaredType().getSymbolOrThrow()
          );
        }
      } else {
        // Interface is imported from other file
        generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} extends ${interfaceName} {}`;
        this.tsSchemasSymbolsToImports.push(schemaSymbol);
      }
    } else if (schema.isArray()) {
      const arrayTypeArg = schema.getTypeArguments()[0];
      const schemaSymbol = arrayTypeArg.getSymbolOrThrow();
      const interfaceName = schemaSymbol.getEscapedName();
      const declaration = schemaSymbol.getDeclarations()[0];

      if (declaration.getSourceFile() !== handlerFile) {
        generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} extends Array<${interfaceName}> {}`;
        this.tsSchemasSymbolsToImports.push(schemaSymbol);
      } else {
        if (arrayTypeArg.isInterface()) {
          const props = arrayTypeArg
            .getProperties()
            .map((p) => p.getValueDeclarationOrThrow().getText())
            .join(" ");

          generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} extends Array<{${props}}> {}`;
        } else {
          generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} extends Array<${declaration.getText()}> {}`;
        }

        for (const typeToImport of getTypesToImport(declaration)) {
          this.tsSchemasSymbolsToImports.push(
            typeToImport.getSymbolOrThrow().getDeclaredType().getSymbolOrThrow()
          );
        }
      }
    } else if (schema.isObject()) {
      /*
       * Schema is defined inline, for example `Handler<Ctx, {car: Car}>`
       * We need extract `{car: Car}` into its own interface and make sure
       * to import types if needed to
       */
      const declaration = schema.getSymbolOrThrow().getDeclarations()[0];

      const typeRefIdentifiers = declaration
        .getDescendantsOfKind(SyntaxKind.TypeReference)
        .map((typeRef) =>
          typeRef.getFirstChildByKindOrThrow(SyntaxKind.Identifier)
        );

      typeRefIdentifiers.forEach((tr) => {
        this.tsSchemasSymbolsToImports.push(
          tr.getSymbolOrThrow().getDeclaredType().getSymbolOrThrow()
        );
      });

      generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} { ${schema
        .getProperties()
        .map((p) => p.getValueDeclarationOrThrow().getText())
        .join("\n")} }`;
    } else {
      console.log("[WARN] Unknown schema type", schema.getText());
    }

    if (generatedSchemaInterfaceStr) {
      this.parsedTsSchemas.push(generatedSchemaInterfaceStr);

      return schemaInterfaceName;
    }
    return;
  }

  private initJsonSchemaGenerator() {
    const formatter = createFormatter({});
    const parser = createParser(this.project.getProgram().compilerObject, {});
    const generator = new SchemaGenerator(
      this.project.getProgram().compilerObject,
      parser,
      formatter,
      {}
    );

    return generator;
  }

  private generateAndSaveJsonSchemas(
    schemas: { reqSchemaType?: string; resSchemaType?: string }[]
  ) {
    const jsonSchemas: Schema[] = [];

    for (const { reqSchemaType, resSchemaType } of schemas) {
      if (reqSchemaType) {
        jsonSchemas.push(this.generateJsonSchema(reqSchemaType));
      }
      if (resSchemaType) {
        jsonSchemas.push(this.generateJsonSchema(resSchemaType));
      }
    }

    const mergedSchemas = jsonSchemas.reduce(
      (out, schema) => {
        if (schema.definitions) {
          out.definitions = { ...out.definitions, ...schema.definitions };
        }
        return out;
      },
      {
        $schema: "http://json-schema.org/draft-07/schema#",
        $ref: "#/definitions/GetCarWithArraySchema_ResSchema",
        definitions: {},
      }
    );

    return fsPromises.writeFile(
      join(this.cwd, ".flink", "schemas", "schemas.json"),
      JSON.stringify(mergedSchemas, null, 2)
    );
  }

  private generateJsonSchema(typeName: string) {
    if (!this.schemaGenerator) {
      this.schemaGenerator = this.initJsonSchemaGenerator();
    }
    return this.schemaGenerator.createSchema(typeName);
  }

  private async extractSchemaTypeFromHandler(
    handlerTypeReference: TypeReferenceNode
  ) {
    // Name of Handler function - should be either `Handler` or `GetHandler`
    const handlerType = handlerTypeReference.getTypeName().getText();

    // Get type arguments a.k.a. generics which holds schemas such as this `Handler<Ctx, ReqSchema, ResSchema>`
    const handlerTypeArgs = handlerTypeReference
      .getType()
      .getAliasTypeArguments();

    let reqSchema: Type<ts.Type> | undefined;
    let resSchema: Type<ts.Type> | undefined;

    if (handlerType === "Handler") {
      // `Handler<Ctx, ReqSchema, ResSchema>`
      // 0 = Ctx, 1 = Req schema, 2 = Res schema
      reqSchema = handlerTypeArgs[1];
      resSchema = handlerTypeArgs[2];
    } else if (handlerType === "GetHandler") {
      // `GetHandler<Ctx, ResSchema>`
      // 0 = Ctx, 1 = Res schema
      resSchema = handlerTypeArgs[1];
    } else {
      fail(
        `Unknown handler type ${handlerType} - should be Handler or GetHandler`
      );
    }

    // TODO: Which source file?
    const sf = handlerTypeReference.getSourceFile();

    const createReqSchemaPromise = reqSchema
      ? this.saveIntermediateTsSchema(
          reqSchema,
          sf,
          `${handlerTypeReference.getStartLineNumber()}_ReqSchema`
        )
      : Promise.resolve("");
    const createResSchemaPromise = resSchema
      ? this.saveIntermediateTsSchema(
          resSchema,
          sf,
          `${handlerTypeReference.getStartLineNumber()}_ResSchema`
        )
      : Promise.resolve("");

    const [reqSchemaType, resSchemaType] = await Promise.all([
      createReqSchemaPromise,
      createResSchemaPromise,
    ]);

    return {
      reqSchemaType,
      resSchemaType,
    };
  }

  /**
   * Creates generated source file that contains all
   * TypeScript schemas that has been derived from handlers.
   */
  private createIntermediateSchemaFile() {
    const schemaSourceFile = this.createSourceFile(
      ["schemas", `schemas.ts`],
      `// Generated ${new Date()}
${this.parsedTsSchemas.join("\n\n")}`
    );

    // Remove duplicates
    this.tsSchemasSymbolsToImports = this.tsSchemasSymbolsToImports.filter(
      (symbol, index, self) =>
        self.findIndex(
          (oSymbol) =>
            oSymbol.getFullyQualifiedName() === symbol.getFullyQualifiedName()
        ) === index
    );

    // Note: Adding imports is a performance savvy task, this could prob be optimized
    // so we use sourceFile.addImportDeclarations (plural) instead
    for (const symbolToImport of this.tsSchemasSymbolsToImports) {
      addImport(schemaSourceFile, symbolToImport);
    }

    schemaSourceFile.save();
  }
}

export default TypeScriptCompiler;
