import { badRequest, conflict, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { Ctx } from "../../Ctx";
import { PostUserReq } from "../../schemas/User/PostReq";
import { PostUserRes } from "../../schemas/User/PostRes";
import { encrypt, genSalt } from "../../utils/bcrypt"
import { GetManagementUserViewModel } from "../../schemas/ManagementUserViewModel";
export const Route: RouteProps = {
  path: "/user",
  method : HttpMethod.post,
};

type Params = {
};

const PostUser: Handler<Ctx, PostUserReq, PostUserRes, Params> = async ({ ctx, req }) => {



    if(req.body.username.length == 0 || req.body.password.length == 0){
      return badRequest("Username and password must be specified");
    }
    const existingUser = await ctx.repos.managementUserRepo.getOne({ username : req.body.username});
    if(existingUser!=null){
      return conflict("Username already taken");
    }

    const salt = await genSalt(10);
    const hash = await encrypt(req.body.password, salt);

    var obj = {
      username : req.body.username,
      password : hash,
      salt : salt
    }

    const user = await ctx.repos.managementUserRepo.create(obj);

    return {
      data: GetManagementUserViewModel(user),
      status : 200
    };

}
export default PostUser;