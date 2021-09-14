import Metadata from "./DefaultExportSchema";

export interface CarModel {
  name: string;
  metadata?: Metadata;
}

export interface CarEngine {
  name: string;
}
