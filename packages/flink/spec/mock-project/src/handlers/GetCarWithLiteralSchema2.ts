import { GetHandler, RouteProps } from "@flink-app/flink";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car-with-literal-schema2",
};

const GetCarWithLiteralSchema2: GetHandler<any, { car: { nestedCar: Car } }> =
  async ({ ctx, req }) => {
    return {
      data: {
        car: { nestedCar: { model: "Volvo" } },
      },
    };
  };

export default GetCarWithLiteralSchema2;
