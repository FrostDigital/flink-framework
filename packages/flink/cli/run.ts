#!/usr/bin/env node
import { Project, DiagnosticCategory, SyntaxKind } from "ts-morph";
import {
  getCollectionNameForRepo,
  getHttpMethodFromHandlerName,
  getRepoInstanceName,
} from "../src/utils";
import { promises as fsPromises } from "fs";
import { join } from "path";
import glob from "tiny-glob";

module.exports = async function run(args: string[]) {
  const startTime = Date.now();
  let dir = "./";
  if (args.includes("--dir")) {
    dir = args[args.indexOf("--dir") + 1];
  }

  if (args[0] === "dev") {
    await clean(dir);
    compile(dir);
    console.log(`Compilation done, took ${Date.now() - startTime}ms`);
  }
};

function compile(dir: string) {
  const project = new Project({
    tsConfigFilePath: dir + "/tsconfig.json",
    compilerOptions: {
      noEmit: false,
      outDir: dir + "/dist",
    },
  });

  console.log("Loaded", project.getSourceFiles().length, "source file(s)");

  const preEmitDiag = project.getPreEmitDiagnostics();

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
      process.exit(1);
    }
  }

  scanHandlers(project, dir);
  scanRepos(project, dir);
  generateStartScript(project, dir);

  project.emitSync();

  require("child_process").fork(dir + "/dist/.flink/start.js", { cwd: dir });
}

/**
 * Scan project for handlers and add those in Flink
 * so they an be registered during start.
 */
function scanHandlers(project: Project, cwd: string) {
  const generatedFile = project.createSourceFile(
    cwd + "/.flink/generatedHandlers.ts",
    `// Generated ${new Date()}
import { scannedHandlers, HttpMethod } from "@flink-app/flink";
export const handlers = [];
scannedHandlers.push(...handlers);
    `,
    {
      overwrite: true,
    }
  );

  const handlersArr = generatedFile
    .getVariableDeclarationOrThrow("handlers")
    .getFirstDescendantByKindOrThrow(SyntaxKind.ArrayLiteralExpression);

  let i = 0;

  for (const sf of project.getSourceFiles()) {
    if (!sf.getFilePath().includes("src/handlers/")) {
      continue;
    }

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

    i++;
  }

  generatedFile.saveSync();
}

function scanRepos(project: Project, cwd: string) {
  const generatedFile = project.createSourceFile(
    cwd + "/.flink/generatedRepos.ts",
    `// Generated ${new Date()}
import { scannedRepos } from "@flink-app/flink";
export const repos = [];
scannedRepos.push(...repos);
    `,
    {
      overwrite: true,
    }
  );

  const reposArr = generatedFile
    .getVariableDeclarationOrThrow("repos")
    .getFirstDescendantByKindOrThrow(SyntaxKind.ArrayLiteralExpression);

  let i = 0;

  for (const sf of project.getSourceFiles()) {
    if (!sf.getFilePath().includes("src/repos/")) {
      continue;
    }

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

  generatedFile.saveSync();
}

/**
 * Generates a start script that will import generated handler and repo
 * before the actual start of flink app. Otherwise singletons `scannedRepos` and `scannedHandlers`
 * will not have been set.
 */
function generateStartScript(project: Project, cwd: string) {
  const filePath = cwd + "/.flink/start.ts";

  project
    .createSourceFile(
      filePath,
      `
// Generated ${new Date()}
import "./generatedHandlers";
import "./generatedRepos";
import "../src/index";
`,
      {
        overwrite: true,
      }
    )
    .saveSync();

  return filePath;
}

async function clean(cwd: string) {
  const files = await glob(".flink/generated*", { cwd });

  for (const file of files) {
    await fsPromises.rm(join(cwd, file));
  }
}
