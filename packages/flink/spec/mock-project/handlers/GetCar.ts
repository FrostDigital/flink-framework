import { GetHandler, RouteProps } from "../../../src/FlinkHttpHandler";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car",
};

const GetCar: GetHandler<any, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default GetCar;
