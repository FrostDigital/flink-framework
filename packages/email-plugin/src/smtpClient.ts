import nodemailer from "nodemailer";

import { email } from "./schemas/email";
import { client } from "./schemas/client";

export interface smtpClientOptions {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export class smtpClient implements client {
  transporter: nodemailer.Transporter;

  constructor(options: smtpClientOptions) {
    this.transporter = nodemailer.createTransport(options);
  }

  async send(email: email) {
    try {
      await this.transporter.sendMail(email);
    } catch (ex) {
      console.log(JSON.stringify(ex));
      return false;
    }
    return true;
  }
}
