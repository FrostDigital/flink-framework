const jobProps: JobProps = {
    id: "hello-world",
    cron: "0 0 0 * * *",
    description: "Hello world job",
};

const helloWorldJob = async ({ ctx, jobProps }: FlinkJob<any>) => {
    log.info("Invoking hello world");
};

export default helloWorldJob;
