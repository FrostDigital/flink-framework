#!/usr/bin/env node
import TypeScriptCompiler from "../src/TypeScriptCompiler";

module.exports = async function run(args: string[]) {
  const startTime = Date.now();
  let dir = "./";
  if (args.includes("--dir")) {
    dir = args[args.indexOf("--dir") + 1];
  }

  const compiler = new TypeScriptCompiler(dir, {});

  if (args[0] === "dev") {
    await TypeScriptCompiler.clean(dir);

    await Promise.all([
      compiler.parseRepos(),
      compiler.parseHandlers(),
      compiler.generateStartScript(),
    ]);
    console.log(`Compilation done, took ${Date.now() - startTime}ms`);
  }
};