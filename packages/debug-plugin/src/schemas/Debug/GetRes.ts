import request from "../../models/request";

export interface GetRes {
    requests: request[];
    enabled: boolean;
}
