import { badRequest, Handler, RouteProps } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";
import { addUser } from "../MockUserRepo";
import SignupReq from "../schemas/SignupReq";

export const Route: RouteProps = {
  path: "/signup",
};

const PostSignup: Handler<ApplicationContext, SignupReq> = async ({
  ctx,
  req,
}) => {
  const { createPasswordHashAndSalt } = ctx.auth;

  const hashRes = await createPasswordHashAndSalt(req.body.password);

  if (!hashRes) {
    return badRequest();
  }

  const user = addUser({
    ...req.body,
    password: hashRes.hash,
    salt: hashRes.salt,
    roles: ["user"],
  });

  return {
    data: user, // In real life we would not include hash and salt in response 💥
  };
};

export default PostSignup;
