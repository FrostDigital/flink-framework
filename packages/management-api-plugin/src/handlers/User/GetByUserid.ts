import { Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { GetUserByUseridReq } from "../../schemas/User/GetByUseridReq";
import { GetUserByUseridRes } from "../../schemas/User/GetByUseridRes";
import { Ctx } from "../../Ctx";
import { GetManagementUserViewModel } from "../../schemas/ManagementUserViewModel";
export const Route: RouteProps = {
  path: "/user/:userid",
  method: HttpMethod.get,
};

// type Params = {
//    userid: string;
// };

const GetUserByUserid: Handler<Ctx, GetUserByUseridReq, GetUserByUseridRes> =
  async ({ ctx, req }) => {
    const user = await ctx.repos.managementuserRepo.getById(req.params.userid);
    if (user == null) {
      return notFound();
    }
    return {
      data: GetManagementUserViewModel(user),
      status: 200,
    };
  };
export default GetUserByUserid;
