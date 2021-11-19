import { FlinkContext, Handler } from "@flink-app/flink";
import { GetManagementUserReq } from "../../schemas/Management/GetUserReq";
import { GetManagementUserRes } from "../../schemas/Management/GetUserRes";

const GetManagementUser: Handler<
  FlinkContext,
  GetManagementUserReq,
  GetManagementUserRes
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  let users = await repo.findAll({});
  users = users.map((u) => {
    return { username: u.username, _id: u._id };
  });

  return {
    data: { users: users },
    status: 200,
  };
};
export default GetManagementUser;
