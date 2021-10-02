import {
  FlinkContext,
  Handler,
  HttpMethod,
  notFound,
  RouteProps,
} from "@flink-app/flink";
import { GetManagementUserByUseridReq } from "../../schemas/Management/GetUserByUseridReq";
import { GetManagementUserByUseridRes } from "../../schemas/Management/GetUserByUseridRes";

const GetManagementUserByUserid: Handler<
  FlinkContext,
  GetManagementUserByUseridReq,
  GetManagementUserByUseridRes
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  const user = await repo.getById(req.params.userid);
  if (user == null) {
    return notFound();
  }

  const { password, salt, ...u } = user;

  return {
    data: u,
    status: 200,
  };
};
export default GetManagementUserByUserid;
