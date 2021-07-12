/* eslint-disable import/no-extraneous-dependencies */
import chalk from "chalk";
import cpy from "cpy";
import fs from "fs";
import os from "os";
import path from "path";
import { tryGitInit } from "./helpers/git";
import { install } from "./helpers/install";
import { isFolderEmpty } from "./helpers/is-folder-empty";
import { isWriteable } from "./helpers/is-writeable";
import { makeDir } from "./helpers/make-dir";

export class DownloadError extends Error {}

export async function createApp({
  appPath,
}: {
  appPath: string;
}): Promise<void> {
  const root = path.resolve(appPath);

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      "The application path is not writable, please check folder permissions and try again."
    );
    console.error(
      "It is likely you do not have write permissions for this folder."
    );
    process.exit(1);
  }

  const appName = path.basename(root);

  await makeDir(root);
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const originalDirectory = process.cwd();

  console.log(`Creating a new Flink app in ${chalk.green(root)}.`);
  console.log();

  await makeDir(root);
  process.chdir(root);

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "nodemon",
      test: "node --preserve-symlinks -r jasmine-ts",
      "test:watch":
        "nodemon --ext ts --exec 'jasmine-ts  --config=./spec/support/jasmine.json'",
      start:
        "node --preserve-symlinks -r ts-node/register -- src/index.ts --project tsconfig.json",
      prestart: "npm run flink:generate",
      pretest: "npm run flink:generate",
      "flink:generate": "flink generate",
    },
  };
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  console.log(`Installing dependencies using npm...`);
  console.log();

  await install(["@flink-app/flink"]);
  await install(
    [
      "typescript@4.2.3",
      "ts-node",
      "nodemon",
      "jasmine",
      "jasmine-ts",
      "@types/jasmine",
      "jasmine-spec-reporter",
      "@flink-app/test-utils",
    ],
    true
  );
  console.log();

  await cpy("**", root, {
    parents: true,
    cwd: path.join(__dirname, "templates", "default"),
    rename: (name) => {
      switch (name) {
        case "gitignore": {
          return ".".concat(name);
        }
        // README.md is ignored by webpack-asset-relocator-loader used by ncc:
        // https://github.com/zeit/webpack-asset-relocator-loader/blob/e9308683d47ff507253e37c9bcbb99474603192b/src/asset-relocator.js#L227
        case "README-template.md": {
          return "README.md";
        }
        default: {
          return name;
        }
      }
    },
  });

  if (tryGitInit(root)) {
    console.log("Initialized a git repository.");
    console.log();
  }

  let cdpath: string;
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  console.log(`${chalk.green("Success!")} Created ${appName} at ${appPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(chalk.cyan(`  npm run dev`));
  console.log("    Starts the development server.");
  console.log();
  console.log(chalk.cyan(`  npm start`));
  console.log("    Runs the built app in production mode.");
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(chalk.cyan("  cd"), cdpath);
  console.log(`  ${chalk.cyan(`npm run dev`)}`);
  console.log();
}
