#!/usr/bin/env node
import { parseSourceFiles } from "../src/FlinkTsParser";

export async function generate() {
  await parseSourceFiles();
}
