/* eslint-disable import/no-extraneous-dependencies */
import spawn from "cross-spawn";

export function install(
  dependencies: string[] | null,
  isDevDeps?: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];

    command = "npm";
    args = (
      [
        "install",
        dependencies && `--${isDevDeps ? "save-dev" : "save"}`,
        dependencies && "--save-exact",
        "--loglevel",
        "error",
      ].filter(Boolean) as string[]
    ).concat(dependencies || []);

    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" },
    });
    child.on("close", (code: any) => {
      if (code !== 0) {
        reject({ command: `${command} ${args.join(" ")}` });
        return;
      }
      resolve();
    });
  });
}
