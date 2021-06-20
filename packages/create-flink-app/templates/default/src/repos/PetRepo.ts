import { FlinkRepo } from "@flink-app/flink";
import { Ctx } from "../Ctx";
import { Pet } from "../schemas/Pet";

class PetRepo extends FlinkRepo<Ctx, Pet> {}

export default PetRepo;
