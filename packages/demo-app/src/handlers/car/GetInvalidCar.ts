import { GetHandler, RouteProps } from "@flink-app/flink";
import Car from "../../schemas/Car";

export const Route: RouteProps = {
  path: "/car-invalid",
};

const GetInvalidCar: GetHandler<any, Car> = async ({ ctx, req }) => {
  // @ts-ignore: To force invalid response
  const invalidCar = { foo: "bar" } as Car;
  return {
    data: invalidCar,
  };
};

export default GetInvalidCar;
