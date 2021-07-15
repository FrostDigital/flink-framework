import { Handler, HttpMethod, notFound, RouteProps, FlinkContext, FlinkRepo } from "@flink-app/flink";
import { GetUserListReq } from "../../schemas/User/GetListReq";
import { GetUserListRes } from "../../schemas/User/GetListRes";
import { Ctx } from "../../Ctx";
import { GetManagementUserViewModel} from "../../schemas/ManagementUserViewModel";

type Params = {
};

const GetUserList: Handler<Ctx, GetUserListReq, GetUserListRes, Params> = async ({ ctx, req }) => {
   
   const repo = ctx.repos.managementUserRepo;
   const users =  await repo.findAll();
 
   
   return {
      data: { 
         users :   users.map(GetManagementUserViewModel)  
      },
      status : 200
    };

}
export default GetUserList;