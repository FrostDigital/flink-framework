import { FlinkContext, Handler, notFound } from "@flink-app/flink";
import { genericAuthContext } from "../genericAuthContext";
import { UserProfile } from "../schemas/UserProfile";

const putUserProfileHandler: Handler<
  FlinkContext<genericAuthContext>,
  UserProfile,
  UserProfile
> = async ({ ctx, req, origin }) => {
  let pluginName = origin || "genericAuthPlugin";
  let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

  let userId = req.user._id;
  let user = await repo.getById(userId);
  if (user == null) {
    return notFound();
  }


  const updatedProfile = {
    ...user.profile,
    ...req.body,
}


  await repo.updateOne(userId, { profile: updatedProfile });

  user = await repo.getById(userId);

  return {
    data: user.profile,
  };
};

export default putUserProfileHandler;
