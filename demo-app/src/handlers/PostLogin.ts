import { Handler, RouteProps, unauthorized } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";
import LoginReq from "../schemas/LoginReq";
import bcrypt from "bcrypt";
import { getUserByUsername } from "../MockUserRepo";

export const Route: RouteProps = {
  path: "/login",
};

const PostLogin: Handler<ApplicationContext, LoginReq> = async ({
  ctx,
  req,
}) => {
  //const valid = req.body.username && req.body.password;

  const user = getUserByUsername(req.body.username);

  if (!user) {
    return unauthorized("No such user");
  }

  console.log(111, await encrypt(req.body.password, user.salt));

  const token = await ctx.authPlugin.createToken(req.body);

  return {
    data: {
      token,
    },
  };
};

export default PostLogin;

function encrypt(password: string, salt: string) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) reject(err);
      resolve(hash);
    });
  });
}

function genSalt() {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) reject(err);
      resolve(salt);
    });
  });
}
