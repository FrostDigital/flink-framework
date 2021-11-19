import { GetHandler, RouteProps } from "@flink-app/flink";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car-with-array-schema3",
};

const GetCarWithArraySchema3: GetHandler<any, CarWrapper[]> = async ({
  ctx,
  req,
}) => {
  return {
    data: [{ car: { model: "Volvo" }, year: 2002 }],
  };
};

interface CarWrapper {
  car: Car;
  year: number;
}

export default GetCarWithArraySchema3;
