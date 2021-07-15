import { FlinkContext, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { DeleteManagementUserByUseridReq } from "../../schemas/Management/DeleteUserByUseridReq";
import { DeleteManagementUserByUseridRes } from "../../schemas/Management/DeleteUserByUseridRes";

const GetGetSchemaHandler = (schema : any) : Handler<FlinkContext, any, any>  =>  {

    const DeleteManagementUserByUserid: Handler<FlinkContext, any, any> = async ({ ctx, req, origin }) => {


    let pluginName = origin || "genericAuthPlugin";
    let repo = ctx.repos[ (<any>ctx.plugins)[pluginName].repoName ];

    const count = await repo.deleteById(req.params.userid);
    if(count == null){
        return notFound();
    }
    
        return {
        data: schema,
        status : 200
        };
    }
    return DeleteManagementUserByUserid;
}
export default GetGetSchemaHandler;