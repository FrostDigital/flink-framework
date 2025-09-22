import { FlinkContext, FlinkResponse, Handler, internalServerError, log, unauthorized } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { genericAuthContext } from "../genericAuthContext";
import { UserLoginReq } from "../schemas/UserLoginReq";
import { UserLoginRes } from "../schemas/UserLoginRes";

const userLoginHandler: Handler<FlinkContext<genericAuthContext>, UserLoginReq, UserLoginRes> = async ({ ctx, req, origin }) => {
    let pluginName = origin || "genericAuthPlugin";
    let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

    let loginResponse: UserLoginRes | undefined = undefined;

    try {
        loginResponse = await ctx.plugins.genericAuthPlugin.loginUser(
            repo,
            <JwtAuthPlugin>ctx.auth,
            req.body.username,
            req.body.password,
            ctx.plugins.genericAuthPlugin.validatePasswordMethod,
            (<any>ctx.plugins)[pluginName].smsOptions,
            (<any>ctx.plugins)[pluginName].onSuccessfulLogin,
            req
        );
    } catch (error: any) {
        // Convert any thrown error that conforms to flink error structure to a proper response
        // Note that any auth failures would not have been thrown, but returned as part of loginResponse
        // but with this it is possible to throw errors from callbacks like onSuccessfulLogin
        if (isFlinkError(error)) {
            log.debug("Caught FlinkError in userLoginHandler:", error);
            return {
                status: error.status,
                error: {
                    id: error.id,
                    title: error.title,
                    code: error.code,
                    detail: error.detail,
                },
            } as FlinkResponse;
        }

        // For other errors, return a generic 500 response
        log.error("Error in userLoginHandler:", error);
        return internalServerError();
    }

    if (loginResponse?.status != "success") {
        switch (loginResponse?.status) {
            case "failed":
                return unauthorized("Invalid username or password", loginResponse.status);
        }
    }

    return {
        data: loginResponse,
        status: 200,
    };
};

export default userLoginHandler;

function isFlinkError(res: any) {
    if (res && res.status && typeof res.status === "number" && res.error && res.error.id) {
        return true;
    }
    return false;
}
