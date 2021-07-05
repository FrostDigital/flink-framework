
import { FlinkContext, Handler } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { UserCreateReq } from "../schemas/UserCreateReq";
import { UserCreateRes } from "../schemas/UserCreateRes";
import { internalServerError } from "@flink-app/flink";
import { formatWithOptions } from "util";

export const userCreateHandler: Handler<  FlinkContext<genericAuthContext>, UserCreateReq, UserCreateRes  > = async ({ ctx, req }) => {

    let { password, username, authentificationMethod, profile } = req.body;
    if(authentificationMethod == null){
        authentificationMethod = "password";
    }
    if(authentificationMethod == "password" && password == null){
        return internalServerError("When using password as authentification method password must be supplied");
    }
    if(password == null){
        password = "";
    }
    let roles : string[] = [];
    if(profile == null) profile = {}

    let repo = ctx.repos[ctx.plugins.genericAuthPlugin.repoName];
    const createUserResponse = await ctx.plugins.genericAuthPlugin.createUser(repo,<JwtAuthPlugin>ctx.auth, username, password, authentificationMethod, roles, profile, ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod   );

    return {
        data: createUserResponse
    };
};
