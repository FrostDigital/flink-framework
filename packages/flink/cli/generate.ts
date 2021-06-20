#!/usr/bin/env node
import { parseSourceFiles } from "../src/FlinkTsParser";

export async function run() {
  await parseSourceFiles();
}
