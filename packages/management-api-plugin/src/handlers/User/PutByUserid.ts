import { conflict, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { Ctx } from "../../Ctx";
import { ManagementUser } from "../../schemas/ManagementUser";
import { GetManagementUserViewModel } from "../../schemas/ManagementUserViewModel";
import { PutUserByUseridReq } from "../../schemas/User/PutByUseridReq";
import { PutUserByUseridRes } from "../../schemas/User/PutByUseridRes";
import { encrypt, genSalt } from "../../utils/bcrypt"


export const Route: RouteProps = {
  path: "/user/:userid",
  method : HttpMethod.put,
};

// type Params = {
//    userid: string;
// };

const PutUserByUserid: Handler<Ctx, PutUserByUseridReq, PutUserByUseridRes> = async ({ ctx, req }) => {

  var model : Partial<ManagementUser> = req.body;
  

  if(model.username != null){
    const existingUser = await ctx.repos.managementUserRepo.getOne({ "username" : model.username});
    if(existingUser!=null){
        if(existingUser._id != req.params.userid){
          return conflict("Username already taken");
        }
    }
  }
  
  if(model.password != null){
    const salt = await genSalt(10);
    const hash = await encrypt(model.password, salt);

    model.password = hash;
    model.salt = salt;
  }

  const updated = await ctx.repos.managementUserRepo.updateOne(req.params.userid, model);
  if(updated == null){
    return notFound();
  }
    return {
      data: GetManagementUserViewModel(updated),
      status : 200
    };

}
export default PutUserByUserid;