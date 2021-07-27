import { badRequest, FlinkContext, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { PutManagementUserPasswordByUseridReq } from "../../schemas/Management/PutUserPasswordByUseridReq";
import { PutManagementUserPasswordByUseridRes } from "../../schemas/Management/PutUserPasswordByUseridRes";
import { JwtAuthPlugin} from "@flink-app/jwt-auth-plugin";

const PutManagementUserPasswordByUserid: Handler<FlinkContext, PutManagementUserPasswordByUseridReq, PutManagementUserPasswordByUseridRes> = async ({ ctx, req, origin }) => {


    let pluginName = origin || "genericAuthPlugin";
    let repo = ctx.repos[ (<any>ctx.plugins)[pluginName].repoName ];

    const user = await repo.getBydId(req.params.userid);
    if(user == null){
      return notFound();
    }


    const resp =  await ctx.plugins.genericAuthPlugin.changePassword(repo, <JwtAuthPlugin>ctx.auth, user._id, req.body.password, );

    const auth = <JwtAuthPlugin>ctx.auth;

    const createPasswordHashAndSaltMethod = ctx.plugins.genericAuthPlugin.createPasswordHashAndSaltMethod;
    let passwordAndSalt = null;
    
    if(createPasswordHashAndSaltMethod == null){
        passwordAndSalt = await auth.createPasswordHashAndSalt(req.body.password);
    }else{
        passwordAndSalt = await createPasswordHashAndSaltMethod(req.body.password)
    }
    
    if(passwordAndSalt == null){
      return badRequest("Password not accepted");
    }
    
    await repo.updateOne(req.params.userid, { password : passwordAndSalt.hash, salt : passwordAndSalt.salt });




    return {
      data: {},
      status : 200
    };

}
export default PutManagementUserPasswordByUserid;