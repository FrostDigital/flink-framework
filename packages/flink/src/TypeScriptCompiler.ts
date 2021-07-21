import { promises as fsPromises } from "fs";
import { join } from "path";
import glob from "tiny-glob";
import {
  DiagnosticCategory,
  Node,
  Project,
  SourceFile,
  SyntaxKind,
  ts,
  Type,
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

interface TypeScriptCompilerOptions {
  debug?: boolean;
}

class TypeScriptCompiler {
  private debug: boolean;
  private project: Project;

  constructor(private cwd: string, { debug }: TypeScriptCompilerOptions = {}) {
    this.debug = !!debug;

    this.project = new Project({
      tsConfigFilePath: join(cwd, "tsconfig.json"),
      compilerOptions: {
        noEmit: false,
        outDir: join(cwd, "dist"),
      },
    });

    if (this.debug) {
      console.log(
        "Loaded",
        this.project.getSourceFiles().length,
        "source file(s)"
      );
    }
  }

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
  }

  /**
   * Catch any compilation errors. Will return false if any Errors
   * exists. Warnings will be passed thru.
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
   * Scan project for handlers and add those to Flinks
   * "singleton" property `scannedHandlers` so they can
   * be registered during start.
   *
   * Will also extract handlers request and response schemas
   * to its own file and parse them into JSON schemas.
   */
  async parseHandlers() {
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

    let i = 0;

    for (const sf of this.project.getSourceFiles()) {
      if (!sf.getFilePath().includes("src/handlers/")) {
        continue;
      }

      console.log(`Detected handler ${sf.getBaseName()}`);

      const namespaceImport = sf.getBaseNameWithoutExtension() + "_" + i;

      generatedFile.addImportDeclaration({
        namespaceImport,
        moduleSpecifier: generatedFile.getRelativePathAsModuleSpecifierTo(sf),
      });

      const assumedHttpMethod = getHttpMethodFromHandlerName(sf.getBaseName());

      handlersArr.insertElement(
        i,
        `{routeProps: ${namespaceImport}.Route, handlerFn: ${namespaceImport}.default, assumedHttpMethod: ${
          assumedHttpMethod ? "HttpMethod." + assumedHttpMethod : undefined
        }}`
      );

      this.extractSchemasFromHandler(sf);

      i++;
    }

    generatedFile.saveSync();

    return generatedFile;
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

    let i = 0;

    for (const sf of this.project.getSourceFiles()) {
      if (!sf.getFilePath().includes("src/repos/")) {
        continue;
      }

      console.log(`Detected repo ${sf.getBaseName()}`);

      generatedFile.addImportDeclaration({
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
  async generateStartScript() {
    const sf = this.createSourceFile(
      ["start.ts"],
      `// Generated ${new Date()}
import "./generatedHandlers";
import "./generatedRepos";
import "../src/index";
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

  private extractSchemasFromHandler(sf: SourceFile) {
    const d = Date.now();
    const defaultExport = getDefaultExport(sf);

    if (defaultExport) {
      const handlerTypeRef = defaultExport.getFirstDescendantByKindOrThrow(
        SyntaxKind.TypeReference
      );

      // Name of Handler function - should be either `Handler` or `GetHandler`
      const handlerType = handlerTypeRef.getTypeName().getText();

      // Get type arguments a.k.a. generics which holds schemas such as this `Handler<Ctx, ReqSchema, ResSchema>`
      const handlerTypeArgs = handlerTypeRef.getType().getAliasTypeArguments();

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

      if (reqSchema) {
        this.createIntermediateSchemaFile(reqSchema, sf, "ReqSchema");
      }
      if (resSchema) {
        this.createIntermediateSchemaFile(resSchema, sf, "ResSchema");
      }
    } else {
      console.warn(
        `Handler ${sf.getBaseName()} is missing default exported handler function`
      );
    }
  }

  private createIntermediateSchemaFile(
    schema: Type<ts.Type>,
    handlerFile: SourceFile,
    suffix: string
  ) {
    if (schema.isAny()) {
      return; // 'any' indicates that no schema is used
    }

    const handlerFileName = handlerFile.getBaseNameWithoutExtension();

    let generatedSchemaInterfaceStr = "";

    const schemaInterfaceName = `${handlerFileName}_${suffix}`;

    const schemaSourceFile = this.createSourceFile(
      ["schemas", `${handlerFileName}_${suffix}.ts`],
      `// Generated ${new Date()}`
    );

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
        generatedSchemaInterfaceStr = `export ${declaration.getText()}`;

        for (const typeToImport of getTypesToImport(declaration)) {
          addImport(
            schemaSourceFile,
            typeToImport.getSymbolOrThrow().getDeclaredType().getSymbolOrThrow()
          );
        }
      } else {
        // Interface is imported from other file
        generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} extends ${interfaceName} {}`;
        addImport(schemaSourceFile, schemaSymbol);
      }
    } else if (schema.isArray()) {
      const arrayTypeArg = schema.getTypeArguments()[0];
      const schemaSymbol = arrayTypeArg.getSymbolOrThrow();
      const interfaceName = schemaSymbol.getEscapedName();
      const declaration = schemaSymbol.getDeclarations()[0];

      if (declaration.getSourceFile() !== handlerFile) {
        generatedSchemaInterfaceStr = `export interface ${schemaInterfaceName} extends Array<${interfaceName}> {}`;
        addImport(schemaSourceFile, schemaSymbol);
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
          addImport(
            schemaSourceFile,
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
        addImport(
          schemaSourceFile,
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
      schemaSourceFile.insertText(
        schemaSourceFile.getText().length,
        "\n" + generatedSchemaInterfaceStr
      );
      schemaSourceFile.saveSync();
    }
  }
}

export default TypeScriptCompiler;