#!/usr/bin/env node
import TypeScriptCompiler from "../src/TypeScriptCompiler";

module.exports = async function run(args: string[]) {
  const startTime = Date.now();

  if (args.includes("--help")) {
    console.log(`
    Description
      Builds the application.
      Will generate intermediates files in .flink and compile/transpile
      javascript bundle in /dist folder

    Usage
      $ flink build <dir>

    <dir> represents the directory of the Flink application.
    If no directory is provided, the current directory will be used.
      
    Options            
      --help    Displays this message
      `);

    process.exit(0);
  }

  let dir = "./";
  if (args[0] && !args[0].startsWith("--")) {
    dir = args[0];
  }

  let exclude = "/spec";
  if (args.includes("--exclude")) {
    exclude = args[args.indexOf("--exclude") + 1];
  }

  await TypeScriptCompiler.clean(dir);

  const compiler = new TypeScriptCompiler(dir);

  if (!compiler.getPreEmitDiagnostics()) {
    process.exit(1);
  }

  await Promise.all([
    compiler.parseRepos(),
    compiler.parseHandlers(exclude.split(",")),
    compiler.generateStartScript(),
  ]);

  console.log(`Compilation done, took ${Date.now() - startTime}ms`);

  compiler.emit();
};
