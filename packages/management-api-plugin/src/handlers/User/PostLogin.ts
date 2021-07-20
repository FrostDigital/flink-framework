import { Handler, HttpMethod, notFound, RouteProps, unauthorized } from "@flink-app/flink";
import { Ctx } from "../../Ctx";
import { PostUserLoginReq } from "../../schemas/User/PostLoginReq";
import { PostUserLoginRes } from "../../schemas/User/PostLoginRes";
import { encrypt } from "../../utils/bcrypt"
import  jsonwebtoken from "jsonwebtoken";
import { GetManagementUserViewModel } from "../../schemas/ManagementUserViewModel";

export const Route: RouteProps = {
  path: "/user/login",
  method : HttpMethod.post,
};

type Params = {
};

const PostUserLogin: Handler<Ctx, PostUserLoginReq, PostUserLoginRes, Params> = async ({ ctx, req }) => {

  const user = await ctx.repos.managementUserRepo.getOne({ "username" : req.body.username});
  if(user == null){
    return unauthorized("Username or password invalid");
  }

  const hashCandidate = await encrypt(req.body.password, user.salt);
  if(hashCandidate !== user.password){
    return unauthorized("Username or password invalid");
  }

  const viewUser = GetManagementUserViewModel(user);

  const token = jsonwebtoken.sign(viewUser, ctx.plugins.managementApi.jwtSecret)





    return {
      data: {
        user : viewUser,
        token
      },
      status : 200
    };

}
export default PostUserLogin;