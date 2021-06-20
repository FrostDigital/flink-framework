export default interface Message {
  /**
   * Devices to send to
   */
  to: string[];

  /**
   * Use `notification` if sending a standard push notification
   * https://firebase.google.com/docs/cloud-messaging/concept-options#notifications
   */
  notification?: {
    /**
     * Optional push notification title
     */
    title?: string;

    /**
     * Optional body
     */
    body?: string;
  };

  /**
   * Use `data` to send data messages.
   * https://firebase.google.com/docs/cloud-messaging/concept-options#data_messages
   */
  data: { [x: string]: string }; // TODO: Is number allowed?
}
