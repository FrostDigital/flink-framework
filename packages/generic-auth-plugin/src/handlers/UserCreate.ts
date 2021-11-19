import {
  badRequest,
  conflict,
  FlinkContext,
  Handler,
  internalServerError,
} from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { genericAuthContext } from "../genericAuthContext";
import { UserCreateReq } from "../schemas/UserCreateReq";
import { UserCreateRes } from "../schemas/UserCreateRes";

const userCreateHandler: Handler<
  FlinkContext<genericAuthContext>,
  UserCreateReq,
  UserCreateRes
> = async ({ ctx, req, origin }) => {
  let { password, username, authentificationMethod, profile } = req.body;
  if (authentificationMethod == null) {
    authentificationMethod = "password";
  }
  if (authentificationMethod == "password" && password == null) {
    return internalServerError(
      "When using password as authentification method password must be supplied"
    );
  }
  if (password == null) {
    password = "";
  }
  let roles: string[] = [];
  if (profile == null) profile = {};

  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  var re = <RegExp>(<any>ctx.plugins)[pluginName].usernameFormat;

  if (!re.test(username)) {
    return badRequest("Username does not meet requirements", "usernameError");
  }

  const createUserResponse = await ctx.plugins.genericAuthPlugin.createUser(
    repo,
    <JwtAuthPlugin>ctx.auth,
    username,
    password,
    authentificationMethod,
    roles,
    profile,
    ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod
  );
  if (createUserResponse.status != "success") {
    switch (createUserResponse.status) {
      case "error":
        return internalServerError("Unknown error", createUserResponse.status);
      case "passwordError":
        return badRequest("Invalid password", createUserResponse.status);
      case "userExists":
        return conflict("User already exists", createUserResponse.status);
    }
  }
  return {
    data: createUserResponse,
    status: 200,
  };
};

export default userCreateHandler;
