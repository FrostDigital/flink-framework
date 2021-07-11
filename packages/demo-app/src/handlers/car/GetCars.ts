import { GetHandler, RouteProps } from "@flink-app/flink";
import CarListRes from "../../schemas/CarListRes";

export const Route: RouteProps = {
  path: "/car",
};

const GetCars: GetHandler<any, CarListRes> = async ({ ctx, req }) => {
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
