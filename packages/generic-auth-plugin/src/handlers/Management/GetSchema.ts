import { FlinkContext, Handler, HttpMethod, notFound, RouteProps } from "@flink-app/flink";

const GetGetSchemaHandler = (schema : any) : Handler<FlinkContext, any, any>  =>  {

    const GetSchemaHandler: Handler<FlinkContext, any, any> = async ({ ctx, req, origin }) => {

   
        return {
        data: schema,
        status : 200
        };
    }
    return GetSchemaHandler;
}
export default GetGetSchemaHandler;