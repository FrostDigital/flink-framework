import { GetHandler, RouteProps } from "@flink-app/flink";
import CarListRes from "../../schemas/CarListRes";

export const Route: RouteProps = {
  path: "/car",
};

type Query = {
  /**
   * Max cars to retrieve
   */
  limit: string;
};

const GetCars: GetHandler<any, CarListRes, any, Query> = async ({
  ctx,
  req,
}) => {
  return {
    data: {
      cars: [
        {
          model: "Volvo",
        },
      ],
    },
  };
};

export default GetCars;
