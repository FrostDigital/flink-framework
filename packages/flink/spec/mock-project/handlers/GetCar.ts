import {
  GetHandler,
  HttpMethod,
  RouteProps,
} from "../../../src/FlinkHttpHandler";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car",
  method: HttpMethod.get,
  permissions: "*",
};

const GetCar: GetHandler<any, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default GetCar;
