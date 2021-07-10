# flink-scaffold

> **WARNING**: This package is in an early stage of development and might be very unstable. 

This package can be used to help you get your flink app up and running very quickly by scaffoling handlers and repos.


## Installations

Install tool to your flink app project:

```
npm i -S @flink-app/flink-scaffold
```

## Usage
From your **root folder** of your flink project, run `npx flink-scaffold` and follow the instruction.


## Creating a handler
Creating a handler from this tool will generate a dummy handler and the response and request schemas. 

⚠️ The schemas genrated sets  string as datatype of all properties.

To create a handler, goto the **root folder** of your flink project and run `npx flink-scaffold` and choose **Handler** and then follow the instructions.



## Creating a repo
Creating a handler from this tool will generate a schema, a repo, put the repo into the Ctx.ts and optinally create specificed CRUD-operations.

⚠️ The schemas genrated sets string as datatype of all properties.

To create a repo, goto the **root folder** of your flink project and run `npx flink-scaffold` and choose **Repo** and then follow the instructions.



## Install as a global package
This package can be installed as a global package, and can after that be run by `flink-scaffold`.

Install the pacakga as a global package by:

```
npm i -g @flink-app/flink-scaffold
```