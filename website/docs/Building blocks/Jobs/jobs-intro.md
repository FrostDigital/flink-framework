---
sidebar_position: 1
---

# Jobs

Scheduled jobs are automated tasks that run at a specified date and time or on a set schedule. They are used to perform repetitive or one-off actions.

Jobs _must_ be created in `/src/jobs`.

By placing it here Flink compiler will recognize it as a job and schedule it based on job props.

A job must have:

-   Exported job props
-   Default exported job function

## Job props

Job props define how the job should be scheduled with the following properties:

| Property   | Description                                                                                                                                                                                        | Example            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| id\*       | Unique id of the job                                                                                                                                                                               | `my-job`           |
| cron       | Cron expression with minute granularity. Cannot be used together with `interval` or `afterDelay`.                                                                                                  | `5 4 * * *`        |
| timezone   | Timezone used for cron expression. Will by default use the systems timezone.                                                                                                                       | `Europe/Stockholm` |
| interval   | Interval the job will be repeated on using `ms` syntax. Cannot be used together with `cron` or `afterDelay`.                                                                                       | `5m`               |
| afterDelay | Run job once after start. Cannot be used together with `cron` or `interval`. `ms` syntax.                                                                                                          | `30s`              |
| singleton  | Boolean indicating if job will run once at a time, meaning that is previous run is not finished, as in the promise is not resolved, then the current iteration will be skipped. Default is `false` | `true`             |

> Important: Either `cron`, `interval` or `afterDelay` must be defined.

Note that the exported variables name must be `Job`. 

### Example: Run job every 5 minutes, but delay it 30 seconds after app start

```typescript
export const Job: JobProps = {
    id: "my-job",
    interval: "5m",
    delay: "30s",
};
```

### Example: Run job 2am every day

```typescript
export const Job: JobProps = {
    id: "my-job",
    cron: "0 2 * * *",
};
```

### Example: Run job 10sec after app started

```typescript
export const Job: JobProps = {
    id: "my-job",
    afterDelay: "10s",
};
```

## Job function

The job function is the actual code that run on the schedule defined by the job props.

It is an async function which has access to the apps context which means it can pretty much do anything.

Example:

```typescript
const RemoveInactiveUsersJob: FlinkJob<AppContext> = async ({ ctx }) => {
    const inactiveUsers = await ctx.usersRepo.findInactiveUsers();

    log.info(`Found ${inactiveUsers.length} inactive users which will be removed`);

    await ctx.usersRepo.removeUsers(inactiveUsers);
};

export default RemoveInactiveUsersJob;
```
