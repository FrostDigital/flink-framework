import { promises as fsPromises } from "fs";
import glob from "tiny-glob";
import { log } from "./FlinkLog";

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
