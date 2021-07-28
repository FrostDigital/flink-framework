import { Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { Ctx } from "../../Ctx";
import { DeleteUserByUseridReq } from "../../schemas/User/DeleteByUseridReq";
import { DeleteUserByUseridRes } from "../../schemas/User/DeleteByUseridRes";

export const Route: RouteProps = {
  path: "/user/:userid",
  method: HttpMethod.delete,
};

// type Params = {
//    userid: string;
// };

const DeleteUserByUserid: Handler<
  Ctx,
  DeleteUserByUseridReq,
  DeleteUserByUseridRes
> = async ({ ctx, req }) => {
  const count = await ctx.repos.managementUserRepo.deleteById(
    req.params.userid
  );
  if (count == 0) {
    return notFound();
  }
  return {
    data: {},
    status: 200,
  };
};
export default DeleteUserByUserid;
