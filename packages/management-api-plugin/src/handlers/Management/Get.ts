import { GetHandler } from "@flink-app/flink";
import { Ctx } from "../../Ctx";
import { GetManagementRes } from "../../schemas/Management/GetRes";

const GetManagement: GetHandler<Ctx, GetManagementRes> = async ({
  ctx,
  req,
}) => {
  return {
    data: ctx.plugins.managementApi.moduleList,
    status: 200,
  };
};
export default GetManagement;
