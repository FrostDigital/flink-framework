import { FlinkJob, FlinkJobProps, log } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";

export const Job: FlinkJobProps = {
    id: "cron-job",
    cron: "* * * * *",
};

export let cronJobInvocations = 0;

const FooCronJob: FlinkJob<ApplicationContext> = async ({ ctx }) => {
    log.info("Invoking FooCronJob");

    if (!ctx) {
        throw new Error("No context available");
    }

    cronJobInvocations++;
};

export default FooCronJob;
