import { FlinkContext } from "@flink-app/flink";
import Message from "./Message";

export interface MessagingSegment{
    id : string, 
    description : string,
    handler(ctx: FlinkContext<any>) : Promise<MessagingTarget[]>
}


export interface MessagingSegmentView extends Omit<MessagingSegment, "handler">{
}

export interface MessagingTarget{
    userId : string,
    pushToken : string[]
}

export interface MessagingData{
    id : string,
    description : string,
    options? : string[]
}
export interface GetManagementModuleConfig {
    pluginId?: string;
    ui: boolean;
    uiSettings?: {
        title: string;
    };
    segments : MessagingSegment[]
    data? : MessagingData[]
    messageSentCallback? : (ctx : any,  target : MessagingTarget[], message : Message) => void
}