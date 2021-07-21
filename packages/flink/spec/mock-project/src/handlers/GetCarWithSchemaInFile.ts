import { GetHandler, HttpMethod, RouteProps } from "@flink-app/flink";

export const Route: RouteProps = {
  path: "/car-with-schema-in-file",
  method: HttpMethod.get,
  permissions: "*",
};

const GetCarWithSchemaInFile: GetHandler<any, InlineCar> = async ({
  ctx,
  req,
}) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

interface InlineCar {
  model: string;
}

export default GetCarWithSchemaInFile;
