#!/usr/bin/env node

const commands = ["generate", "generate-schema", "run"];

const argv = process.argv.slice(2);
const argCommand = argv[0];

if (!argCommand) {
  console.log(`flink [${commands.join("|")}]`);
  process.exit();
}

if (!commands.includes(argv[0])) {
  console.log(`Invalid command: ${argCommand}`);
  process.exit(1);
}

const cmd = require("../cli/" + argCommand);

cmd(argv.slice(1));

export default () => {};
