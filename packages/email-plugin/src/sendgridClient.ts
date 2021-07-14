import { MailService } from "@sendgrid/mail";
import { internalServerError } from "@flink-app/flink";

import { email } from "./schemas/email";
import { client } from "./schemas/client";

export interface sendgridClientOptions {
  /**
   * API-key to use when sending email
   */
  apiKey: string;
}

export class sendgridClient implements client {
  sendgrid: MailService;

  constructor(options: sendgridClientOptions) {
    this.sendgrid = new MailService();
    this.sendgrid.setApiKey(options.apiKey);
  }

  async send(email: email) {
    try {
      await this.sendgrid.send(email);
    } catch (ex) {
      throw internalServerError(JSON.stringify(ex));
    }
    return true;
  }
}
