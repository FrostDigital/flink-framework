export type email = {
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

  /**
   * attached file object
   */
  attachments?: AttachmentObject[];

} & ({ text: string } | { html: string });


interface AttachmentObject {

  /**
   * base64 encoded string
   */
  content: string,

  filename: string,

  type: string,

  disposition: string
}
