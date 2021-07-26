import { promises as fsPromises } from "fs";
import { sep } from "path";
import glob from "tiny-glob";
import { log } from "./FlinkLog";
import { ensureDir } from "fs-extra";

export async function readJsonFile(path: string) {
  try {
    const file = await fsPromises.readFile(path);
    return JSON.parse(file.toString());
  } catch (err) {
    return {};
  }
}

export async function readJsonFiles(globPattern: string) {
  const files = await glob(globPattern);

  const readPromises = files.map((file) =>
    fsPromises
      .readFile(file)
      .then((data) => JSON.parse(data.toString()))
      .catch((err) => {
        log.error(`Failed reading file ${file}: ${err}`);
        return {};
      })
  );
  return await Promise.all(readPromises);
}

export async function writeJsonFile(
  path: string,
  content: any,
  opts: { ensureDir?: boolean } = {}
) {
  if (opts.ensureDir) {
    const i = path.lastIndexOf(sep);
    if (i > 0 && i < path.length - 1) {
      await ensureDir(path.substr(0, i));
    }
  }

  let jsonStr = "";

  try {
    jsonStr = JSON.stringify(content, null, 2);
  } catch (err) {
    console.error("Failed to parse content into json string:", content);
    throw new Error(err);
  }

  return fsPromises.writeFile(path, jsonStr);
}
