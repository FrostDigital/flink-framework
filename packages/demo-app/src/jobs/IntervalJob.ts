import { FlinkJob, FlinkJobProps, log } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";

export const Job: FlinkJobProps = {
    id: "interval-job",
    interval: "1s",
};

export let intervalJobInvocations = 0;

const IntervalJob: FlinkJob<ApplicationContext> = async ({ ctx }) => {
    log.info("Invoking IntervalJob");

    if (!ctx) {
        throw new Error("No context available");
    }

    intervalJobInvocations++;
};

export default IntervalJob;
