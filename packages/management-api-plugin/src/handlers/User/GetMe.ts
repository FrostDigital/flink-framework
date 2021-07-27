import { Handler, HttpMethod, notFound, RouteProps, unauthorized } from "@flink-app/flink";
import { Ctx } from "../../Ctx";
import { GetUserMeReq } from "../../schemas/User/GetMeReq";
import { GetUserMeRes } from "../../schemas/User/GetMeRes";
import jsonwebtoken from "jsonwebtoken";
import { ManagementUserViewModel } from "../../schemas/ManagementUserViewModel";

const GetUserMe: Handler<Ctx, GetUserMeReq, GetUserMeRes> = async ({ ctx, req }) => {

  try{
    const user = jsonwebtoken.verify(<string>req.headers["management-token"], ctx.plugins.managementApi.jwtSecret) as any;
    const { iat, ...rest } = user;
    return {
      data: {
        token : <string>req.headers["management-token"],
        user : rest
      },
      status : 200
    };
  }catch(ex){
    return unauthorized();
  }
  


  

}
export default GetUserMe;