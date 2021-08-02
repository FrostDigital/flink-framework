import { GetHandler, HttpMethod, RouteProps } from "@flink-app/flink";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car/:id",
  method: HttpMethod.get,
};

type Query = {
  /**
   * For pagination
   */
  page: string;
};

const GetCar: GetHandler<any, Car, { id: string }, Query> = async ({
  ctx,
  req,
}) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default GetCar;
