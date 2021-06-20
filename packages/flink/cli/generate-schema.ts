#!/usr/bin/env node
import { parseAndWriteSchemas } from "../src/FlinkTsParser";

export async function run() {
  await parseAndWriteSchemas();
}
