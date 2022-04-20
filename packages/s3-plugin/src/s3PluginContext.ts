import { FlinkRepo } from "@flink-app/flink";
import S3Client from "./s3Client";

export interface s3PluginContext {
    s3Plugin: {
        s3Client: S3Client;
    };
}
