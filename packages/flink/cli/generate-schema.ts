#!/usr/bin/env node
import { parseAndWriteSchemas } from "../src/FlinkTsParser";

module.exports = async function run() {
  await parseAndWriteSchemas();
};
