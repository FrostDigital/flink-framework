import { FlinkRepo } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";
import Car from "../schemas/Car";

class CarRepo extends FlinkRepo<ApplicationContext, Car> {}

export default CarRepo;
