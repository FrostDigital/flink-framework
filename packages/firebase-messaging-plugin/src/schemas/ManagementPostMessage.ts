export interface ManagementPostMessageRequest {
    segment: string;
    subject: string;
    body: string;
    data: { [key: string]: string };
}
export interface ManagementPostMessageResponse {}
