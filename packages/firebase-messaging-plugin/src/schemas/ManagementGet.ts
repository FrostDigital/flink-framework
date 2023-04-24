import { MessagingData, MessagingSegmentView } from "./ManagementModule";

export interface ManagementGetRequest {}

export interface ManagementGetResponse {
    segments: MessagingSegmentView[];
    data: MessagingData[];
}
