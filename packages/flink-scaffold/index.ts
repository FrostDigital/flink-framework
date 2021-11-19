#!/usr/bin/env node
import prompts from "prompts";
import fs from "fs-extra";
import chalk from "chalk";

const main = async () => {
  if (!fs.existsSync("./package.json")) {
    console.log(chalk.red("Folder seams to not be a flink project?"));
    process.exit();
  }

  if (
    !fs.readFileSync("./package.json").toString().includes("@flink-app/flink")
  ) {
    console.log(chalk.red("Folder seams to not be a flink project?"));
    process.exit();
  }

  const response = await prompts([
    {
      type: "select",
      name: "action",
      message: "What do you want to scaffold?",
      choices: [
        { title: "Handler", value: "handler" },
        { title: "Repo", value: "repo" },
      ],
    },
  ]);

  switch (response.action) {
    case "handler":
      scaffoldHandler();
      break;
    case "repo":
      scaffoldRepo();
      break;
  }
};

const scaffoldRepo = async () => {
  const response = await prompts([
    { type: "text", name: "object", message: "Object name (eg. user)" },
    {
      type: "list",
      name: "schema",
      message: "Schema properties (comma separated)",
      separator: ",",
    },
    {
      type: "multiselect",
      name: "handlers",
      message: "Generate handlers",
      choices: [
        { value: "create", title: "Create" },
        { value: "get", title: "Get item" },
        { value: "update", title: "Update item" },
        { value: "list", title: "List items" },
        { value: "delete", title: "Delete item" },
      ],
    },
  ]);
  let permission = "no";
  if (response.handlers.length > 0) {
    permission = (
      await prompts({
        type: "select",
        name: "permission",
        message: "Require permission for Handlers?",
        choices: [
          { value: "no", title: "no" },
          { value: "authenticated", title: "authenticated" },
          { value: "custom", title: "custom" },
        ],
      })
    ).permission;
    if (permission == "custom") {
      permission = (
        await prompts([
          { type: "text", name: "permission", message: "Required permission" },
        ])
      ).permission;
    }
  }

  let objectName = capitalizeFirstLetter(response.object);
  let repoName = response.object.toLowerCase();
  let schema = <string[]>response.schema;
  if (schema.includes("_id")) schema.unshift("_id");

  console.log(chalk.magenta("   Creating ./src/schemas/" + objectName + ".ts"));
  let outSchema = "export interface " + objectName + "{\n";
  outSchema += schema
    .filter((p: string) => p.length > 0)
    .map((p: string) => {
      return "   " + p + ": string;";
    })
    .join("\n");
  outSchema += "\n}";
  fs.ensureFileSync("./src/schemas/" + objectName + ".ts");
  fs.writeFileSync("./src/schemas/" + objectName + ".ts", outSchema);

  console.log(
    chalk.magenta("   Creating ./src/repos/" + objectName + "Repo.ts")
  );
  let outRepo = 'import { FlinkRepo } from "@flink-app/flink";\n';
  outRepo += 'import { Ctx } from "../Ctx";\n';
  outRepo +=
    "import { " + objectName + ' } from "../schemas/' + objectName + '";\n\n';
  outRepo +=
    "class " +
    objectName +
    "Repo extends FlinkRepo<Ctx, " +
    objectName +
    "> {};\n\n";
  outRepo += "export default " + objectName + "Repo;\n";
  fs.ensureFileSync("./src/repos/" + objectName + "Repo.ts");
  fs.writeFileSync("./src/repos/" + objectName + "Repo.ts", outRepo);

  console.log(chalk.magenta("   Trying to add repo to  ./src/Ctx.ts"));
  let rows = fs.readFileSync("./src/Ctx.ts").toString().split("\n");
  let newRows = [];
  let reposStartPointFound = false;
  let reposInjected = false;
  let importInjected = false;

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    if (!importInjected && !row.startsWith("import ")) {
      console.log(chalk.magenta("      Found injection point for import"));
      newRows.push(
        "import " + objectName + 'Repo from "./repos/' + objectName + 'Repo";'
      );
      importInjected = true;
    }

    if (!reposInjected && reposStartPointFound && row.includes("}")) {
      console.log(chalk.magenta("      Found injection point for repo"));
      newRows.push("    " + repoName + "Repo: " + objectName + "Repo;");
      reposInjected = true;
    }

    if (!reposStartPointFound && row.includes("repos:")) {
      reposStartPointFound = true;
    }

    newRows.push(row);
  }
  if (reposInjected && importInjected) {
    fs.writeFileSync("./src/Ctx.ts", newRows.join("\n"));
    console.log(
      chalk.green("      Successfully injected repo to ./src/Ctx.ts")
    );
  }

  if (response.handlers.includes("create")) {
    let code =
      "const resp = await ctx.repos." + repoName + "Repo.create(req.body);\n\n";
    code += "   return {\n";
    code += "       data: resp,\n";
    code += "       status : 200,\n";
    code += "   };\n";

    let reqCode =
      "import { " + objectName + ' } from "../' + objectName + '";\n\n';
    reqCode +=
      "export interface %Name% extends Omit<" + objectName + ', "_id"> {}\n';

    let resCode =
      "import { " + objectName + ' } from "../' + objectName + '";\n\n';
    resCode += "export interface %Name% extends " + objectName + " {}\n";

    generateHandler(
      objectName,
      "",
      "",
      "post",
      permission,
      [],
      [],
      code,
      reqCode,
      resCode
    );
  }

  if (response.handlers.includes("list")) {
    let code =
      "   const items = await ctx.repos." + repoName + "Repo.findAll({});\n\n";
    code += "   return {\n";
    code += "       data: { items },\n";
    code += "       status : 200,\n";
    code += "   };\n";

    let resCode =
      "import { " + objectName + ' } from "../' + objectName + '";\n\n';
    resCode += "export interface %Name% {\n";
    resCode += "   items : " + objectName + "[];\n";
    resCode += "}\n";

    generateHandler(
      objectName,
      "",
      "",
      "get",
      permission,
      [],
      [],
      code,
      "",
      resCode
    );
  }

  if (response.handlers.includes("get")) {
    let code =
      "   const item = await ctx.repos." +
      repoName +
      "Repo.getById(req.params.id);\n\n";
    code += "   if(item == null){\n";
    code += "       return notFound();\n";
    code += "     }\n\n";
    code += "   return {\n";
    code += "       data: item,\n";
    code += "       status : 200,\n";
    code += "   };\n";

    let resCode =
      "import { " + objectName + ' } from "../' + objectName + '";\n\n';
    resCode += "export interface %Name% extends " + objectName + " {}\n";

    generateHandler(
      objectName,
      "",
      "id",
      "get",
      permission,
      [],
      [],
      code,
      "",
      resCode
    );
  }

  if (response.handlers.includes("delete")) {
    let code =
      "   const items = await ctx.repos." +
      repoName +
      "Repo.deleteById(req.params.id);\n\n";
    code += "   if(items == 0){\n";
    code += "       return notFound();\n";
    code += "     }\n\n";
    code += "   return {\n";
    code += "       data: {},\n";
    code += "       status : 200,\n";
    code += "   };\n";
    generateHandler(
      objectName,
      "",
      "id",
      "delete",
      permission,
      [],
      [],
      code,
      "",
      ""
    );
  }

  if (response.handlers.includes("update")) {
    let code =
      "   const item = await ctx.repos." +
      repoName +
      "Repo.updateOne(req.params.id, req.body);\n\n";
    code += "   if(item == null){\n";
    code += "       return notFound();\n";
    code += "     }\n\n";

    code += "   return {\n";
    code += "       data: item,\n";
    code += "       status : 200,\n";
    code += "   };\n";

    let reqCode =
      "import { " + objectName + ' } from "../' + objectName + '";\n\n';
    reqCode +=
      "export interface %Name% extends Partial<Omit<" +
      objectName +
      ', "_id">> {}\n';

    let resCode =
      "import { " + objectName + ' } from "../' + objectName + '";\n\n';
    resCode += "export interface %Name% extends " + objectName + " {}\n";

    generateHandler(
      objectName,
      "",
      "id",
      "put",
      permission,
      [],
      [],
      code,
      "",
      resCode
    );
  }
};

const scaffoldHandler = async () => {
  const response = await prompts([
    { type: "text", name: "module", message: "Module name (eg. auth)" },
    {
      type: "text",
      name: "action",
      message: "Object or action name (eg. user)",
    },
    { type: "text", name: "parameter", message: "Url Parameter (eg. userid)" },
    {
      type: "list",
      name: "reqParameters",
      message: "Enter request body parameters (comma separated)",
      separator: ",",
      hint: "Comma separated",
    },
    {
      type: "list",
      name: "resValues",
      message: "Enter response values (comma separated)",
      separator: ",",
    },
    {
      type: "select",
      name: "method",
      message: "HTTP VERB / Method",
      choices: [
        { value: "get", title: "get" },
        { value: "post", title: "post" },
        { value: "put", title: "put" },
        { value: "delete", title: "delete" },
      ],
    },
    {
      type: "select",
      name: "permission",
      message: "Require permission?",
      choices: [
        { value: "no", title: "no" },
        { value: "authenticated", title: "authenticated" },
        { value: "custom", title: "custom" },
      ],
    },
  ]);

  let permission = response.permission;
  if (permission == "custom") {
    permission = (
      await prompts([
        { type: "text", name: "permission", message: "Required permission" },
      ])
    ).permission;
  }

  generateHandler(
    response.module,
    response.action,
    response.parameter,
    response.method,
    permission,
    response.reqParameters,
    response.resValues,
    "",
    "",
    ""
  );
};

function generateHandler(
  _module: string,
  _action: string,
  _parameter: string,
  _method: string,
  _permission: string,
  _reqParameters: string[],
  _resValues: string[],
  _code: string,
  _reqSchemaCode: string,
  resSchemaCode: string
) {
  console.log(chalk.blue("Creating handler"));

  const module = capitalizeFirstLetter(_module);
  const action = capitalizeFirstLetter(_action);
  const parameter = capitalizeFirstLetter(_parameter.toLowerCase());
  const methodName = capitalizeFirstLetter(_method);

  let url = "/" + module.toLowerCase() + "/" + action.toLocaleLowerCase();

  var fileNameBase = module + "/" + methodName + action;
  var objBase = methodName + module + action;

  if (parameter != "") {
    url += "/:" + parameter.toLocaleLowerCase();
    fileNameBase += "By" + parameter;
    objBase += "By" + parameter;
  }
  var reqSchemaName = objBase + "Req";
  var resSchemaName = objBase + "Res";

  if (url.endsWith("/")) url = url.substring(0, url.length - 1);
  url = url.replace("//", "/");

  var out =
    'import { Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";\n';
  out += 'import { Ctx } from "../../Ctx";\n';
  out +=
    "import { " +
    reqSchemaName +
    ' } from "../../schemas/' +
    fileNameBase +
    'Req";\n';
  out +=
    "import { " +
    resSchemaName +
    ' } from "../../schemas/' +
    fileNameBase +
    'Res";\n\n';

  out += "export const Route: RouteProps = {\n";
  out += '  path: "' + url + '",\n';
  out += "  method : HttpMethod." + _method + ",\n";
  if (_permission != "no") {
    out += '  permissions : "' + _permission + '",\n';
  }
  out += "};\n\n";

  out += "type Params = {\n";
  if (parameter != "") {
    out += "   " + parameter.toLocaleLowerCase() + ": string;\n";
  }
  out += "};\n\n";

  out +=
    "const " +
    objBase +
    ": Handler<Ctx, " +
    reqSchemaName +
    ", " +
    resSchemaName +
    ", Params> = async ({ ctx, req }) => {\n\n";

  if (_code == "") {
    out += "    return {\n";
    out += "      data: {},\n";
    out += "      status : 200\n";
    out += "    };\n\n";
  } else {
    out += _code;
  }
  out += "}\n";

  out += "export default " + objBase + ";";

  console.log(
    chalk.magenta("   Creating ./src/handlers/" + fileNameBase + ".ts")
  );
  fs.ensureFileSync("./src/handlers/" + fileNameBase + ".ts");
  fs.writeFileSync("./src/handlers/" + fileNameBase + ".ts", out);

  console.log(
    chalk.magenta("   Creating ./src/schemas/" + fileNameBase + "Req.ts")
  );
  var outReq = "export interface " + reqSchemaName + "{\n";
  outReq += _reqParameters
    .filter((p) => p.length > 0)
    .map((p) => {
      return "   " + p + ": string;";
    })
    .join("\n");
  outReq += "\n}";
  if (_reqSchemaCode != "")
    outReq = _reqSchemaCode.replace("%Name%", reqSchemaName);
  fs.ensureFileSync("./src/schemas/" + fileNameBase + "Req.ts");
  fs.writeFileSync("./src/schemas/" + fileNameBase + "Req.ts", outReq);

  console.log(
    chalk.magenta("   Creating ./src/schemas/" + fileNameBase + "Res.ts")
  );
  var outRes = "export interface " + resSchemaName + "{\n";
  outRes += _resValues
    .filter((p) => p.length > 0)
    .map((p) => {
      return "   " + p + ": string;";
    })
    .join("\n");
  outRes += "\n}";
  if (_reqSchemaCode != "")
    outRes = _reqSchemaCode.replace("%Name%", resSchemaName);
  fs.ensureFileSync("./src/schemas/" + fileNameBase + "Res.ts");
  fs.writeFileSync("./src/schemas/" + fileNameBase + "Res.ts", outRes);

  console.log(chalk.green("   Handler created"));
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

main();
