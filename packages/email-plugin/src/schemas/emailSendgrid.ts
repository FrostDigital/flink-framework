export type emailSendgrid = {
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
  attachments?: Attachment[];

} & ({ text: string } | { html: string });


interface Attachment {

  /**
   * base64 encoded string
   */
  content: string,

  filename: string,

  type?: string,

  disposition?: string,

} 
