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

  if (user.profile == null) user.profile = {};

  const profile = {
    ...user.profile,
    ...req.body,
  };

  await repo.updateOne(user._id, { profile: profile });

  return {
    data: {},
    status: 200,
  };
};
export default PutManagementUserProfileByUserid;
