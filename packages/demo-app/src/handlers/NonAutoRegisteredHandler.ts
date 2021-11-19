import { GetHandler, RouteProps } from "@flink-app/flink";
import CarListRes from "../schemas/CarListRes";

export const Route: RouteProps = {
  path: "/non-auto-reg",
  skipAutoRegister: true,
};

const NonAutoRegisteredHandler: GetHandler<any, CarListRes> = async ({
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

export default NonAutoRegisteredHandler;
