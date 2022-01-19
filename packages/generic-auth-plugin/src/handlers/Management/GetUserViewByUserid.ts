import { FlinkContext, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";
import { User } from "../..";
import { GetManagementUserViewByUseridReq } from "../../schemas/Management/GetUserViewByUseridReq";
import { GetManagementUserViewByUseridRes } from "../../schemas/Management/GetUserViewByUseridRes";

const GetManagementUserByUserid: Handler<FlinkContext, GetManagementUserViewByUseridReq, GetManagementUserViewByUseridRes> = async ({ ctx, req, origin }) => {
    let pluginName = origin || "genericAuthPlugin";
    let repo = ctx.repos[(<any>ctx.plugins)[pluginName].repoName];

    const user = await repo.getById(req.params.userid);
    if (user == null) {
        return notFound();
    }

    const modules = ctx.plugins.managementApi.moduleList.modules as any[];
    const module = modules.find((p) => p.id == origin);

    let getData = (user: User): GetManagementUserViewByUseridRes => {
        let data = {
            username: user.username,
        };

        return {
            buttons: [],
            data,
        };
    };

    if (module?.data.userViewGetData != null) {
        getData = module?.data.userViewGetData as (user: User) => GetManagementUserViewByUseridRes;
    }

    return {
        data: getData(user),
        status: 200,
    };
};
export default GetManagementUserByUserid;
