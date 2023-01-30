import Logger from "node-color-log";

export const log = {
    debug: Logger.debug.bind(Logger),
    info: Logger.info.bind(Logger),
    warn: Logger.warn.bind(Logger),
    error: Logger.error.bind(Logger),
    json: (...args: any) => {
        for (const o of args) {
            console.log(JSON.stringify(o, null, 2));
        }
    },
    bgColorLog: Logger.bgColorLog.bind(Logger),
    fontColorLog: Logger.fontColorLog.bind(Logger),
    setLevel: (level: "debug" | "info" | "warn" | "error") => Logger.setLevel.bind(Logger)(level),
};
