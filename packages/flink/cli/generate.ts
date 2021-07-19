#!/usr/bin/env node
import { parseSourceFiles } from "../src/FlinkTsParser";

module.exports = async function run() {
  await parseSourceFiles();
};
