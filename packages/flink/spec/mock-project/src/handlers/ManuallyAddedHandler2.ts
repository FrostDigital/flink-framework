import { Handler, RouteProps } from "@flink-app/flink";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/manually-added-handler-2",
  skipAutoRegister: true,
};

const manuallyAddedHandler: Handler<any, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default manuallyAddedHandler;
