import { Handler, RouteProps } from "../../../src/FlinkHttpHandler";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car",
};

const PutCar: Handler<any, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default PutCar;
