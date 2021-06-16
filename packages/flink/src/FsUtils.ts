import { promises as fsPromises } from "fs";

export async function readJsonFile(path: string) {
  try {
    const file = await fsPromises.readFile(path);
    return JSON.parse(file.toString());
  } catch (err) {
    return {};
  }
}
