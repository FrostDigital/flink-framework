import { Pet } from "./Pet";

/**
 * Creates new Pet.
 * Will set `_id` and `created` timestamp after created.
 */
export interface PostPetReq extends Omit<Pet, "_id" | "created"> {}
