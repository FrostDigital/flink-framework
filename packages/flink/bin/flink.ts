#!/usr/bin/env node

import { log } from "../src";

const commands = ["generate"];
log.setLevel("debug");

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

import("../cli/" + argCommand)
  .then((i) => i.generate())
  .catch((err) => {
    console.log(err);
  });

export default () => {};
