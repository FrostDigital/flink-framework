import { FlinkContext, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { DeleteManagementUserByUseridReq } from "../../schemas/Management/DeleteUserByUseridReq";
import { DeleteManagementUserByUseridRes } from "../../schemas/Management/DeleteUserByUseridRes";


const DeleteManagementUserByUserid: Handler<FlinkContext, DeleteManagementUserByUseridReq, DeleteManagementUserByUseridRes> = async ({ ctx, req, origin }) => {


  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[ (<any>ctx.plugins)[pluginName].repoName ];

  const count = await repo.deleteById(req.params.userid);
  if(count == null){
    return notFound();
  }
  
    return {
      data: {},
      status : 200
    };

}
export default DeleteManagementUserByUserid;