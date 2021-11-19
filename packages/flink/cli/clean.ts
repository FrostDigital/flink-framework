#!/usr/bin/env node
import TypeScriptCompiler from "../src/TypeScriptCompiler";

module.exports = async function run(args: string[]) {
  if (args.includes("--help")) {
    console.log(`
    Description
      Removes all generated files.

    Usage
      $ flink clean <dir>

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

  const cleanedFolder = await TypeScriptCompiler.clean(dir);

  console.log(`Cleaned directory ${cleanedFolder}`);
};
