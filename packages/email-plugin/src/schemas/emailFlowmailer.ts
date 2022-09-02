import { Readable } from "stream";
import { Url } from "url";

export type emailFlowmailer = {
  /**
   * From address used to send the email
   */
  from: string;

  /**
   * Email addresses to send to
   */
  to: string[];

  /**
   * Reply email
   */
  replyTo?: string;

  /**
   * Email addresses to add as BCC
   */
  bcc?: string[];

  /**
   * Subject of email
   */
  subject: string;

  text? : string

  html? : string

};
