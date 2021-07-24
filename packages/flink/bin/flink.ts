#!/usr/bin/env node

const commands = [
  "build",
  "generate" /* 'generate' is alias for 'build'   */,
  "run",
  "clean",
  "help",
];

const argv = process.argv.slice(2);
let argCommand = argv[0];

if (!argCommand || argv[0] === "help") {
  console.log(`Usage: flink [${commands.join("|")}]`);
  process.exit();
}

if (!commands.includes(argv[0])) {
  console.log(`Invalid command: ${argCommand}`);
  process.exit(1);
}

if (argCommand === "generate") {
  argCommand = "build";
}

const cmd = require("../cli/" + argCommand);

cmd(argv.slice(1));

export default () => {};
