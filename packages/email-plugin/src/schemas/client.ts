import { email } from "./email";

export interface client {
  send(email: email): Promise<boolean>;
}
