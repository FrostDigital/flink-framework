import fs, { promises as fsPromises } from "fs";
import { JSONSchema7 } from "json-schema";
import { join } from "path";
import glob from "tiny-glob";
import { CompletedConfig, createFormatter, createParser, Schema, SchemaGenerator } from "ts-json-schema-generator";
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
    VariableDeclarationKind,
} from "ts-morph";
import { writeJsonFile } from "./FsUtils";
import { addImports, getDefaultExport, getInterfaceName, getTypeMetadata, getTypesToImport } from "./TypeScriptUtils";
import { getCollectionNameForRepo, getHttpMethodFromHandlerName, getRepoInstanceName } from "./utils";

class TypeScriptCompiler {
    private project: Project;
    private schemaGenerator?: SchemaGenerator;
    private isEsm: boolean;

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
        // Detect if project is using ESM based solely on package.json "type": "module"
        this.isEsm = this.isEsmProject(cwd);

        const compilerOptions: ts.CompilerOptions = {
            noEmit: false, // We need to emit files
            outDir: join(cwd, "dist"),
        };

        // Set appropriate module settings based on detected module system
        if (this.isEsm) {
            // For ESM projects, use ESNext module with Node resolution
            compilerOptions.module = ts.ModuleKind.ESNext;
            compilerOptions.moduleResolution = ts.ModuleResolutionKind.NodeJs;
            compilerOptions.esModuleInterop = true;
        } else {
            // For CommonJS projects, use CommonJS module with Node resolution
            compilerOptions.module = ts.ModuleKind.CommonJS;
            compilerOptions.moduleResolution = ts.ModuleResolutionKind.NodeJs;
        }

        this.project = new Project({
            tsConfigFilePath: join(cwd, "tsconfig.json"),
            compilerOptions,
        });

        console.log("Loaded", this.project.getSourceFiles().length, "source file(s) from", cwd);
        console.log("Module system:", this.isEsm ? "ESM" : "CommonJS");
        console.log("Using module:", compilerOptions.module === ts.ModuleKind.ESNext ? "ESNext" : "CommonJS");
    }

    /**
     * Detects if the project is using ESM (ECMAScript Modules)
     * by checking type in package.json.
     */
    private isEsmProject(cwd: string): boolean {
        try {
            // Check package.json for "type": "module"
            const packageJsonPath = join(cwd, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                return packageJson.type === "module";
            }
        } catch (error) {
            // If we can't determine, default to CommonJS
            console.warn("Error detecting module system, defaulting to CommonJS:", error);
        }

        return false;
    }

    /**
     * Gets the module specifier for imports, adding .js extension for ESM
     */
    private getModuleSpecifier(fromFile: SourceFile, toFile: SourceFile): string {
        let moduleSpecifier = fromFile.getRelativePathAsModuleSpecifierTo(toFile);

        // Add .js extension for ESM imports (only for relative paths)
        if (this.isEsm && !moduleSpecifier.startsWith("@") && !moduleSpecifier.endsWith(".js")) {
            moduleSpecifier += ".js";
        }

        return moduleSpecifier;
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
                let message = diag.getMessageText();

                while (typeof message !== "string") {
                    message = message.getMessageText();
                }

                if (diag.getCategory() === DiagnosticCategory.Error) {
                    console.error(`[ERROR] ${diag.getSourceFile()?.getBaseName()} (line ${diag.getLineNumber()}):`, message);
                    hasError = true;
                }
                if (diag.getCategory() === DiagnosticCategory.Warning) {
                    console.warn(`[WARNING] ${diag.getSourceFile()?.getBaseName()} (line ${diag.getLineNumber()}):`, message);
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
     * "singleton" property `autoRegisteredHandlers` so they can
     * be registered during start.
     *
     * Also extract handlers request and response schemas from Handler
     * type arguments.
     */
    async parseHandlers(excludeDirs: string[] = []) {
        const generatedFile = this.createSourceFile(
            ["generatedHandlers.ts"],
            `// Generated ${new Date()}
import { autoRegisteredHandlers, HttpMethod } from "@flink-app/flink";
export const handlers = [];
autoRegisteredHandlers.push(...handlers);
    `
        );
        const handlersArr = generatedFile.getVariableDeclarationOrThrow("handlers").getFirstDescendantByKindOrThrow(SyntaxKind.ArrayLiteralExpression);

        const handlers = await this.parseHandlerDir(generatedFile, handlersArr);

        generatedFile.addImportDeclarations(handlers.imports);

        await generatedFile.save();

        await this.createIntermediateSchemaFile();

        const jsonSchemas = await this.generateAndSaveJsonSchemas(handlers.schemasToGenerate);

        this.appendSchemasToHandlerSourceFiles(handlers.schemasToGenerate, jsonSchemas);

        return generatedFile;
    }

    /**
     * Scan `/src/handlers/*.ts` for handler files and register those.
     */
    private async parseHandlerDir(generatedFile: SourceFile, handlersArr: ArrayLiteralExpression) {
        const imports: OptionalKind<ImportDeclarationStructure>[] = [];
        let i = 0;
        const schemasToGenerate: {
            reqSchemaType?: string;
            resSchemaType?: string;
            sourceFile: SourceFile;
        }[] = [];

        for (const sf of this.project.getSourceFiles()) {
            if (!sf.getFilePath().includes("src/handlers/")) {
                continue;
            }

            const isAutoRegister = this.isAutoRegisterableHandler(sf);

            console.log(`Detected handler ${sf.getBaseName()} ${!isAutoRegister ? "(requires manual registration)" : ""}`);

            const namespaceImport = sf.getBaseNameWithoutExtension().replace(/\./g, "_") + "_" + i;

            imports.push({
                defaultImport: "* as " + namespaceImport,
                moduleSpecifier: this.getModuleSpecifier(generatedFile, sf),
            });

            const assumedHttpMethod = getHttpMethodFromHandlerName(sf.getBaseName());

            const schemaTypes = await this.extractSchemasFromHandlerSourceFile(sf);

            // Append schemas and metadata to source file that will be part of emitted dist bundle (javascript)
            sf.addVariableStatement({
                declarationKind: VariableDeclarationKind.Const,
                isExported: true,
                declarations: [
                    {
                        name: "__assumedHttpMethod",
                        initializer: `"${assumedHttpMethod || ""}"`,
                    },
                    {
                        name: "__file",
                        initializer: `"${sf.getBaseName()}"`,
                    },
                    {
                        name: "__query",
                        initializer: `[${(schemaTypes?.queryMetadata || [])
                            .map(({ description, name }) => `{description: "${description}", name: "${name}"}`)
                            .join(",")}]`,
                    },
                    {
                        name: "__params",
                        initializer: `[${(schemaTypes?.paramsMetadata || [])
                            .map(({ description, name }) => `{description: "${description}", name: "${name}"}`)
                            .join(",")}]`,
                    },
                ],
            });

            if (isAutoRegister) {
                handlersArr.insertElement(
                    i,
                    `{handler: ${namespaceImport}, assumedHttpMethod: ${assumedHttpMethod ? "HttpMethod." + assumedHttpMethod : undefined}}`
                );
                i++;
            }

            if (schemaTypes) {
                schemasToGenerate.push({ ...schemaTypes, sourceFile: sf });
            }
        }

        return {
            imports,
            schemasToGenerate,
        };
    }

    async parseRepos() {
        const generatedFile = this.createSourceFile(
            ["generatedRepos.ts"],
            `// Generated ${new Date()}
  import { autoRegisteredRepos } from "@flink-app/flink";
  export const repos = [];
  autoRegisteredRepos.push(...repos);
      `
        );

        const reposArr = generatedFile.getVariableDeclarationOrThrow("repos").getFirstDescendantByKindOrThrow(SyntaxKind.ArrayLiteralExpression);

        const imports: OptionalKind<ImportDeclarationStructure>[] = [];

        let i = 0;

        for (const sf of this.project.getSourceFiles()) {
            if (!sf.getFilePath().includes("src/repos/")) {
                continue;
            }

            console.log(`Detected repo ${sf.getBaseName()}`);

            imports.push({
                defaultImport: sf.getBaseNameWithoutExtension(),
                moduleSpecifier: this.getModuleSpecifier(generatedFile, sf),
            });

            reposArr.insertElement(
                i,
                `{collectionName: "${getCollectionNameForRepo(sf.getBaseName())}", repoInstanceName: "${getRepoInstanceName(
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
     * Otherwise singletons `autoRegisteredRepos` and `autoRegisteredHandlers` will not have been set.
     */
    async generateStartScript(appEntryScript = "/src/index.ts") {
        if (!this.project.getSourceFile((sf) => sf.getFilePath().endsWith(appEntryScript))) {
            console.error(`Cannot find entry script '${appEntryScript}'`);
            return process.exit(1);
        }

        const sf = this.createSourceFile(
            ["start.ts"],
            `// Generated ${new Date()}
import "./generatedHandlers${this.isEsm ? ".js" : ""}";
import "./generatedRepos${this.isEsm ? ".js" : ""}";
import "./generatedJobs${this.isEsm ? ".js" : ""}";
import "..${appEntryScript.replace(/\.ts/g, "")}${this.isEsm ? ".js" : ""}";
export default {}; // Export an empty object to make it a module
`
        );

        await sf.save();

        return sf;
    }

    private createSourceFile(filename: string[], contents: string) {
        return this.project.createSourceFile(join(this.cwd, ".flink", ...filename), contents, {
            overwrite: true,
        });
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
     *
     * Return names of req and/or res schema types.
     */
    private async extractSchemasFromHandlerSourceFile(handlerSourceFile: SourceFile) {
        const defaultExport = getDefaultExport(handlerSourceFile);

        if (defaultExport) {
            const handlerTypeRef = defaultExport.getFirstDescendantByKindOrThrow(SyntaxKind.TypeReference);

            return this.extractSchemaTypeFromHandler(handlerTypeRef);
        } else {
            console.warn(`Handler ${handlerSourceFile.getBaseName()} is missing default exported handler function`);
        }
    }

    private async saveIntermediateTsSchema(schema: Type<ts.Type>, handlerFile: SourceFile, suffix: string) {
        if (schema.isAny()) {
            return; // 'any' indicates that no schema is used
        }

        const handlerFileName = handlerFile.getBaseNameWithoutExtension().replace(/\./g, "_");

        let generatedSchemaInterfaceStr = "";

        const schemaInterfaceName = `${handlerFileName}_${suffix}`;

        if (schema.isInterface()) {
            /*
             * Type argument is an interface. This should be normal case when
             * schema is defined directly for example `Handler<Ctx, Car>`
             */
            const schemaSymbol = schema.getSymbolOrThrow();
            const interfaceName = getInterfaceName(schemaSymbol);
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
                    this.tsSchemasSymbolsToImports.push(typeToImport.getSymbolOrThrow().getDeclaredType().getSymbolOrThrow());
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
                    this.tsSchemasSymbolsToImports.push(typeToImport.getSymbolOrThrow().getDeclaredType().getSymbolOrThrow());
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
                .map((typeRef) => typeRef.getFirstChildByKindOrThrow(SyntaxKind.Identifier));

            typeRefIdentifiers.forEach((tr) => {
                this.tsSchemasSymbolsToImports.push(tr.getSymbolOrThrow().getDeclaredType().getSymbolOrThrow());
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
        const conf: CompletedConfig = {
            expose: "none", // Do not create shared $ref definitions.
            topRef: false, // Removes the wrapper object around the schema.
            additionalProperties: false,
            jsDoc: "basic",
            sortProps: false,
            strictTuples: false,
            minify: false,
            markdownDescription: false,
            skipTypeCheck: false,
            encodeRefs: false,
            extraTags: [],
            functions: "fail",
            discriminatorType: "json-schema",
        };
        const formatter = createFormatter(conf);
        const parser = createParser(this.project.getProgram().compilerObject, conf);
        const generator = new SchemaGenerator(this.project.getProgram().compilerObject, parser, formatter, conf);

        return generator;
    }

    private async generateAndSaveJsonSchemas(schemas: { reqSchemaType?: string; resSchemaType?: string }[]) {
        const jsonSchemas: Schema[] = [];

        for (const { reqSchemaType, resSchemaType } of schemas) {
            if (reqSchemaType) {
                jsonSchemas.push({ definitions: { [reqSchemaType]: this.generateJsonSchema(reqSchemaType) } });
            }
            if (resSchemaType) {
                jsonSchemas.push({ definitions: { [resSchemaType]: this.generateJsonSchema(resSchemaType) } });
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
                $ref: "#/definitions/Schemas",
                definitions: {},
            }
        );

        const filePath = join(this.cwd, ".flink", "schemas", "schemas.json");

        await writeJsonFile(filePath, mergedSchemas);

        this.project.addSourceFileAtPath(filePath);

        return mergedSchemas;
    }

    private generateJsonSchema(typeName: string) {
        if (!this.schemaGenerator) {
            this.schemaGenerator = this.initJsonSchemaGenerator();
        }
        return this.schemaGenerator.createSchema(typeName);
    }

    private async extractSchemaTypeFromHandler(handlerTypeReference: TypeReferenceNode) {
        // Name of Handler function - should be either `Handler` or `GetHandler`
        const handlerType = handlerTypeReference.getTypeName().getText();

        // Get type arguments a.k.a. generics which holds schemas such as this `Handler<Ctx, ReqSchema, ResSchema>`
        const handlerTypeArgs = handlerTypeReference.getType().getAliasTypeArguments();

        let reqSchema: Type<ts.Type> | undefined;
        let resSchema: Type<ts.Type> | undefined;
        let params: Type<ts.Type> | undefined;
        let query: Type<ts.Type> | undefined;

        if (handlerType === "Handler") {
            // `Handler<Ctx, ReqSchema, ResSchema, Params, Query>`
            // 0 = Ctx, 1 = Req schema, 2 = Res schema, 3 = Params, 4 = Query
            reqSchema = handlerTypeArgs[1];
            resSchema = handlerTypeArgs[2];
            params = handlerTypeArgs[3];
            query = handlerTypeArgs[4];
        } else if (handlerType === "GetHandler") {
            // `GetHandler<Ctx, ResSchema, Params, Query>`
            // 0 = Ctx, 1 = Res schema, 2 = Params, 3 = Query
            resSchema = handlerTypeArgs[1];
            params = handlerTypeArgs[2];
            query = handlerTypeArgs[3];
        } else {
            throw new Error(`Unknown handler type ${handlerType} in ${handlerTypeReference.getSourceFile().getBaseName()} - should be Handler or GetHandler`);
        }

        const sf = handlerTypeReference.getSourceFile();

        const createReqSchemaPromise = reqSchema
            ? this.saveIntermediateTsSchema(reqSchema, sf, `${handlerTypeReference.getStartLineNumber()}_ReqSchema`)
            : Promise.resolve("");

        const createResSchemaPromise = resSchema
            ? this.saveIntermediateTsSchema(resSchema, sf, `${handlerTypeReference.getStartLineNumber()}_ResSchema`)
            : Promise.resolve("");

        const [reqSchemaType, resSchemaType] = await Promise.all([createReqSchemaPromise, createResSchemaPromise]);

        return {
            reqSchemaType,
            resSchemaType,
            queryMetadata: getTypeMetadata(query),
            paramsMetadata: getTypeMetadata(params),
        };
    }

    /**
     * Creates generated source file that contains all
     * TypeScript schemas that has been derived from handlers.
     */
    private async createIntermediateSchemaFile() {
        const schemaSourceFile = this.createSourceFile(
            ["schemas", `schemas.ts`],
            `// Generated ${new Date()}
${this.parsedTsSchemas.join("\n\n")}`
        );

        addImports(schemaSourceFile, this.tsSchemasSymbolsToImports);

        return schemaSourceFile.save();
    }

    /**
     * Check if handler source file is up for auto registration by inspecting
     * the Route.
     *
     * @param sf handler file
     * @returns
     */
    private isAutoRegisterableHandler(sf: SourceFile) {
        const route = sf.getVariableDeclaration("Route");

        if (!route) {
            return false;
        }

        const routeProps = route.getFirstDescendantByKindOrThrow(SyntaxKind.ObjectLiteralExpression);

        const skipAutoRegProp = routeProps.getProperty("skipAutoRegister");

        return !skipAutoRegProp || skipAutoRegProp.getText().endsWith("false");
    }

    /**
     * Appends generated json schemas to handler source files.
     *
     * @param handlers
     * @param jsonSchemas
     */
    private appendSchemasToHandlerSourceFiles(
        handlers: {
            sourceFile: SourceFile;
            reqSchemaType?: string;
            resSchemaType?: string;
        }[],
        jsonSchemas: JSONSchema7
    ) {
        const jsonSchemaDefs = jsonSchemas.definitions || {};

        for (const { sourceFile, reqSchemaType, resSchemaType } of handlers) {
            if (reqSchemaType && !jsonSchemaDefs[reqSchemaType]) {
                console.error(`Handler ${sourceFile.getBaseName()} has request schema (${reqSchemaType}) defined, but no JSON schema has been generated`);
                continue;
            }

            if (resSchemaType && !jsonSchemaDefs[resSchemaType]) {
                console.error(`Handler ${sourceFile.getBaseName()} has response schema (${resSchemaType}) defined, but no JSON schema has been generated`);
                continue;
            }

            const reqJsonSchema = JSON.stringify(reqSchemaType ? jsonSchemaDefs[reqSchemaType] : undefined);
            const resJsonSchema = JSON.stringify(resSchemaType ? jsonSchemaDefs[resSchemaType] : undefined);

            sourceFile.addVariableStatement({
                declarationKind: VariableDeclarationKind.Const,
                isExported: true,
                declarations: [
                    {
                        name: "__schemas",
                        type: "any",
                        initializer: `{ reqSchema: ${reqJsonSchema}, resSchema: ${resJsonSchema} }`,
                    },
                ],
            });
        }
    }

    /**
     * Scans project for jobs so they can be registered during start.
     */
    async parseJobs() {
        const generatedFile = this.createSourceFile(
            ["generatedJobs.ts"],
            `// Generated ${new Date()}
import { autoRegisteredJobs } from "@flink-app/flink";
export const jobs = [];
autoRegisteredJobs.push(...jobs);
    `
        );

        const jobsArr = generatedFile.getVariableDeclarationOrThrow("jobs").getFirstDescendantByKindOrThrow(SyntaxKind.ArrayLiteralExpression);

        const imports: OptionalKind<ImportDeclarationStructure>[] = [];
        let i = 0;

        for (const sf of this.project.getSourceFiles()) {
            if (!sf.getFilePath().includes("src/jobs/")) {
                continue;
            }

            console.log(`Detected job ${sf.getBaseName()}`);

            const namespaceImport = sf.getBaseNameWithoutExtension().replace(/\./g, "_") + "_" + i;

            imports.push({
                defaultImport: "* as " + namespaceImport,
                moduleSpecifier: this.getModuleSpecifier(generatedFile, sf),
            });

            // Append metadata to source file that will be part of emitted dist bundle (javascript)
            sf.addVariableStatement({
                declarationKind: VariableDeclarationKind.Const,
                isExported: true,
                declarations: [
                    {
                        name: "__file",
                        initializer: `"${sf.getBaseName()}"`,
                    },
                ],
            });

            jobsArr.insertElement(i, namespaceImport);

            i++;
        }

        generatedFile.addImportDeclarations(imports);

        await generatedFile.save();

        return generatedFile;
    }
}

export default TypeScriptCompiler;
