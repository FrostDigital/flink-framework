import { Handler } from "@flink-app/flink";
import Car from "../schemas/Car";

// This handle is added using `app.addHandler()` and hence should not have
// any route props defined

const manuallyAddedHandler: Handler<any, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default manuallyAddedHandler;
