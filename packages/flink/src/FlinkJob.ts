import { FlinkContext } from "./FlinkContext";

export type FlinkJobProps = {
    /**
     * Id of job, must be unique
     */
    id: string;

    /**
     * Cron expression for scheduling job with minute precision
     * Example: * * * * *
     */
    cron?: string;

    /**
     * Timezone for cron expression
     * Example: Europe/Stockholm
     */
    timezone?: string;

    /**
     * Interval for scheduling job
     * Uses ms syntax, i.e. 1s, 1m, 1h, 1d
     */
    interval?: string;

    /**
     * If true, job will only run once at startup after delay.
     * Uses ms syntax, i.e. 1s, 1m, 1h, 1d
     */
    afterDelay?: string;

    /**
     * If true, job will only one at a time.
     *
     * If a job is already running, the next invocation will be ignored and will be
     * retried after the next interval.
     */
    singleton?: boolean;
};

/**
 * Type for Flink job function. This function should be default exported from
 * a Job file and the body is what will be executed when the job is invoked.
 */
export interface FlinkJob<C extends FlinkContext> {
    (params: { ctx: C }): Promise<any>;
}

/**
 * Type for Job file.
 *
 * Describes shape of exports when using syntax like:
 *
 * `import * as FooJob from "./src/jobs/FooJob"
 */
export type FlinkJobFile = {
    default: FlinkJob<any>;
    Job: FlinkJobProps;
    /**
     * Typescript source file name, is set at compile time by Flink compiler.
     */
    __file?: string;
};
