import { Readable } from "stream";
import { Url } from "url";

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
  attachments?: Attachment[];

} & ({ text: string } | { html: string });


interface Attachment {

  /**
   * String, Buffer or a Stream contents for the attachment
   */
  content?: string | Buffer | Readable,

  /**
   * filename to be reported as the name of the attached file. Use of unicode is allowed
   */
  filename?: string | false,

  /**
   * path to the file if you want to stream the file instead of including it (better for larger attachments)
   */
  path?: string | Url,

  /**
   * an URL to the file (data uris are allowed as well)
   */
  href?: string,

  /**
   * optional HTTP headers to pass on with the href request, eg. {authorization: "bearer ..."}
   */
  httpHeaders?: string,

  /**
   * optional content type for the attachment, if not set will be derived from the filename property
   */
  contentType?: string,

  /**
   * optional content disposition type for the attachment, defaults to ‘attachment’
   */
  contentDisposition?: 'attachment' | 'inline',

  /**
   * optional content id for using inline images in HTML message source
   */
  cid?: string,

  /**
   * If set and content is string, then encodes the content to a Buffer using the specified encoding. Example values: ‘base64’, ‘hex’, ‘binary’ etc. 
   * Useful if you want to use binary attachments in a JSON formatted email object
   */
  encoding?: string,

  /**
   * custom headers for the attachment node. Same usage as with message headers
   */
  headers?: { [key: string]: string | string[] | { prepared: boolean, value: string } } | Array<{ key: string, value: string }>,

  /**
   * is an optional special value that overrides entire contents of current mime node including mime headers.
   *  Useful if you want to prepare node contents yourself
   */
  raw?: string | Buffer

} 

