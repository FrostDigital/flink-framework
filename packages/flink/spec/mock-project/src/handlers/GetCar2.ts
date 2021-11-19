import { GetHandler, HttpMethod, RouteProps } from "@flink-app/flink";
import { CarEngine, CarModel } from "../schemas/FileWithTwoSchemas";

export const Route: RouteProps = {
  path: "/car2",
  method: HttpMethod.get,
  permissions: "*",
};

const GetCar2: GetHandler<any, { model: CarModel; engine: CarEngine }> =
  async ({ ctx, req }) => {
    return {
      data: {
        model: { name: "Mercedes" },
        engine: { name: "Rolls Royce" },
      },
    };
  };

export default GetCar2;
