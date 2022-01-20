import { badRequest, conflict, FlinkContext, Handler, internalServerError } from "@flink-app/flink";
export interface Action {
    id: string;
    description?: string;
    arguments: ActionArguments[];
    handler(ctx: FlinkContext<any>, args: ActionArgumentsValues): Promise<ActionResponse>;
}
export interface ActionArgumentsValues {
    [key: string]: any;
}

export interface ActionResponse {
    status: ActionReturnStatus;
    error?: string;
    data?: {
        [key: string]: any;
    };
}

export enum ActionReturnStatus {
    success = "SUCCESS",
    error = "ERROR",
}

export interface ActionArguments {
    id: string;
    required: boolean;
    type: ActionArugmentType;
    default?: string;
}

export enum ActionArugmentType {
    text = "TEXT",
}

export interface ActionView {
    id: string;
    description?: string;
    arguments: ActionArguments[];
}
