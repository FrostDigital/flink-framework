import { BankIdPluginOptions } from "./BankIdPluginOptions";

export interface BankIdPluginContext {
  bankIdClient: any;
  options: BankIdPluginOptions;
}