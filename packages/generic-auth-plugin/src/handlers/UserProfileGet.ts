import { FlinkContext, Handler, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { UserProfile } from "../schemas/UserProfile";

const getProfileHandler: Handler<
  FlinkContext<genericAuthContext>,
  UserProfile
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  let userId = req.user._id;
  let user = await repo.getBydId(userId);
  if (user == null) {
    return notFound();
  }

  return {
    data: user.profile,
  };
};

export default getProfileHandler;
