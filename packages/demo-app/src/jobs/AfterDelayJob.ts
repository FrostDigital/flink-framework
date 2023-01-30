import { FlinkJob, FlinkJobProps, log } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";

export const Job: FlinkJobProps = {
    id: "after-delay-job",
    afterDelay: "1s",
};

export let afterDelayInvocations = 0;

const AfterDelayJob: FlinkJob<ApplicationContext> = async ({ ctx }) => {
    log.info("Invoking AfterDelayJob");

    if (!ctx) {
        throw new Error("No context available");
    }

    afterDelayInvocations++;
};

export default AfterDelayJob;
