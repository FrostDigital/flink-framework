import { conflict, FlinkContext, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { PutManagementUserUsernameByUseridReq } from "../../schemas/Management/PutUserUsernameByUseridReq";
import { PutManagementUserUsernameByUseridRes } from "../../schemas/Management/PutUserUsernameByUseridRes";


const PutManagementUserUsernameByUserid: Handler<FlinkContext, PutManagementUserUsernameByUseridReq, PutManagementUserUsernameByUseridRes> = async ({ ctx, req, origin }) => {

  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[ (<any>ctx.plugins)[pluginName].repoName ];

  const user = await repo.getBydId(req.params.userid);
  if(user == null){
    return notFound();
  }

  const existingUser = await repo.getOne({ username : req.body.username.toLocaleLowerCase() });
  if(existingUser != null){
    if(existingUser._id != user._id){
      return conflict("Username already taken");
    }
  }
  
  await repo.updateOne(user._id, { username : req.body.username.toLocaleLowerCase() });


    return {
      data: {},
      status : 200
    };

}
export default PutManagementUserUsernameByUserid;