export type JobProps = {
    /**
     * Id of job, must be unique
     */
    id: string;
    /**
     * Cron expression for scheduling job
     */
    cron?: string;
    /**
     * Interval for scheduling job
     * Uses ms syntax, i.e. 1s, 1m, 1h, 1d
     */
    interval?: string;
};
