import { GetHandler, RouteProps } from "@flink-app/flink";
import Car from "../../schemas/Car";

export const Route: RouteProps = {
  path: "/car-secret",
  permissions: "car:get",
};

const GetSecretCar: GetHandler<any, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default GetSecretCar;
