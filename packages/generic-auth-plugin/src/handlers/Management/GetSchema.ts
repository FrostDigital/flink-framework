import { FlinkContext, Handler } from "@flink-app/flink";


  const GetSchema: Handler<FlinkContext, any, any> = async ({
    ctx,
    req,
    origin,
  }) => {

      const modules = ctx.plugins.managementApi.moduleList.modules as any[];
      const module = modules.find( p => p.id == origin);

    return {
      data: module?.data.profileSchema,
      status: 200,
    };
  };

export default GetSchema;
