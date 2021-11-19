import {
  FlinkContext,
  Handler,
  HttpMethod,
  notFound,
  RouteProps,
} from "@flink-app/flink";
import { PutManagementUserProfileByUseridReq } from "../../schemas/Management/PutUserProfileByUseridReq";
import { PutManagementUserProfileByUseridRes } from "../../schemas/Management/PutUserProfileByUseridRes";

const PutManagementUserProfileByUserid: Handler<
  FlinkContext,
  PutManagementUserProfileByUseridReq,
  PutManagementUserProfileByUseridRes
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  const user = await repo.getById(req.params.userid);
  if (user == null) {
    return notFound();
  }

  await repo.updateOne(user._id, { profile: req.body });

  return {
    data: {},
    status: 200,
  };
};
export default PutManagementUserProfileByUserid;
