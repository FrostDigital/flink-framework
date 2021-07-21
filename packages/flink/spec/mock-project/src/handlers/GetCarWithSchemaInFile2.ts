import { GetHandler, HttpMethod, RouteProps } from "@flink-app/flink";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car-with-schema-in-file2",
  method: HttpMethod.get,
  permissions: "*",
};

const GetCarWithSchemaInFile2: GetHandler<any, InlineCar> = async ({
  ctx,
  req,
}) => {
  return {
    data: {
      car: { model: "Volvo" },
    },
  };
};

interface InlineCar {
  car: Car;
}

export default GetCarWithSchemaInFile2;
