import { Handler, RouteProps, unauthorized } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";
import { getUserByUsername } from "../MockUserRepo";
import LoginReq from "../schemas/LoginReq";

export const Route: RouteProps = {
    path: "/login",
};

const PostLogin: Handler<ApplicationContext, LoginReq> = async ({ ctx, req }) => {
    const { createToken, validatePassword } = ctx.auth;
    const user = getUserByUsername(req.body.username);

    if (!user) {
        return unauthorized("No such user");
    }

    if (!(await validatePassword(req.body.password, user.password, user.salt))) {
        return unauthorized("Invalid username or password");
    }

    const token = await createToken(req.body, user.roles);

    return {
        data: {
            token,
        },
    };
};

export default PostLogin;
