import { debug, info, warn, error, setLevel } from "node-color-log";

export const log = {
  debug: (...args: any[]) => debug(args),
  info: (...args: any[]) => info(args),
  warn: (...args: any[]) => warn(args),
  error: (...args: any[]) => error(args),
  json: (...args: any) => {
    for (const o of args) {
      console.log(JSON.stringify(o, null, 2));
    }
  },
  setLevel: (level: "debug" | "info" | "warn" | "error") => setLevel(level),
};
