import { GetHandler, log, RouteProps } from "@flink-app/flink";
import CarListRes from "../../schemas/CarListRes";

export const Route: RouteProps = {
    path: "/car/:id",
};

type Parameters = {
    id: string;
};

const GetCarById: GetHandler<any, CarListRes, Parameters> = async ({ ctx, req }) => {
    log.debug("Getting car with id", req.params.id);

    return {
        status: 200,
        data: {
            cars: [
                {
                    model: "Volvo",
                },
            ],
        },
    };
};

export default GetCarById;
