#!/usr/bin/env node
import TypeScriptCompiler from "../src/TypeScriptCompiler";

module.exports = async function run(args: string[]) {
  if (args.includes("--help")) {
    console.log(`
    Description
      Removes all generated files.

    Usage
      $ flink clean
      
    Options
      --dir     Directory to project root where tsconfig.json is located, default "./"      
      --help    Displays this message
      `);

    process.exit(0);
  }

  let dir = "./";
  if (args.includes("--dir")) {
    dir = args[args.indexOf("--dir") + 1];
  }

  const cleanedFolder = await TypeScriptCompiler.clean(dir);

  console.log(`Cleaned directory ${cleanedFolder}`);
};
