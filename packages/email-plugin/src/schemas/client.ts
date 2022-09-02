import { email } from "./email";
import { emailFlowmailer } from "./emailFlowmailer";
import { emailSendgrid } from "./emailSendgrid";

export interface client {
  send(email: email | emailSendgrid | emailFlowmailer): Promise<boolean>;
}
