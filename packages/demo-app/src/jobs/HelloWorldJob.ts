import { log } from "@flink-app/flink";

const jobProps: JobProps = {
    id: "hello-world",
    cron: "* * * * *",
    description: "Hello world job",
};

const helloWorldJob = async ({ ctx, jobProps }: FlinkJob<any>) => {
    log.info("Invoking hello world");
};

export default helloWorldJob;
