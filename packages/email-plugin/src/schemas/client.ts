import { email } from "./email";
import { emailSendgrid } from "./emailSendgrid";

export interface client {
  send(email: email | emailSendgrid): Promise<boolean>;
}
