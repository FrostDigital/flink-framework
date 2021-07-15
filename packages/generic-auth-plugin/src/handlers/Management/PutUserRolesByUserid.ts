import { FlinkContext, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { PutManagementUserRolesByUseridReq } from "../../schemas/Management/PutUserRolesByUseridReq";
import { PutManagementUserRolesByUseridRes } from "../../schemas/Management/PutUserRolesByUseridRes";



const PutManagementUserRolesByUserid: Handler<FlinkContext, PutManagementUserRolesByUseridReq, PutManagementUserRolesByUseridRes> = async ({ ctx, req, origin }) => {

  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[ (<any>ctx.plugins)[pluginName].repoName ];

  const user = await repo.getBydId(req.params.userid);
  if(user == null){
    return notFound();
  }

  
  await repo.updateOne(user._id, { roles : req.body.roles });


    return {
      data: {},
      status : 200
    };
}
export default PutManagementUserRolesByUserid;