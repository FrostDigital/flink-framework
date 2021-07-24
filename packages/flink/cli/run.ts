#!/usr/bin/env node
import TypeScriptCompiler from "../src/TypeScriptCompiler";

module.exports = async function run(args: string[]) {
  const startTime = Date.now();

  if (args.includes("--help")) {
    console.log(`
    Description
      Compiles and starts the application.

    Usage
      $ flink run <dir>

    <dir> represents the directory of the Flink application.
    If no directory is provided, the current directory will be used.
      
    Options      
      --entry   Entry script for app, default "/src/index.ts"
      --help    Displays this message
      `);

    process.exit(0);
  }

  let dir = "./";
  if (args[0] && !args[0].startsWith("--")) {
    dir = args[0];
  }

  let entry = "/src/index.ts";
  if (args.includes("--entry")) {
    entry = args[args.indexOf("--entry") + 1];
  }

  const compiler = new TypeScriptCompiler(dir);

  await TypeScriptCompiler.clean(dir);

  if (!compiler.getPreEmitDiagnostics()) {
    process.exit(1);
  }

  await Promise.all([
    compiler.parseRepos(),
    compiler.parseHandlers(),
    compiler.generateStartScript(entry),
  ]);

  console.log(`Compilation done, took ${Date.now() - startTime}ms`);

  compiler.emit();

  require("child_process").fork(dir + "/dist/.flink/start.js");
};
