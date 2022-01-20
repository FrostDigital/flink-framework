# Flink API Docs

A FLINK management-api module that makes it possible to expose actions that can be executed via the management-api, and thereby also via flink-admin.

## Prerequisite 
Flink management-api-plugin must be installed and configured to your project.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/management-actions-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { GetManagementModule as GetActionsManagmenetModule } from '@flink-app/management-actions-plugin'

const actionsManagementModule = GetActionsManagmenetModule({
    ui: true,
    uiSettings: {
        title: 'Actions',
    },
    actions : [
      {
        id: 'hello-world',
        description: 'Greets you',
        arguments: [
            {
                id: 'name',
                type: ActionArugmentType.text,
                required: true,
            },
        ],
        async handler(ctx: FlinkContext<any>, args: ActionArgumentsValues): Promise<ActionResponse> {
            
            return {
                data: {
                    message: 'Hello ' + args.name,
                },
                status: ActionReturnStatus.success,
            }
        },
    },
    
    ]
})


function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    plugins: [
        // Register plugin
        managementApiPlugin({
          token : "SECRET_TOKEN_USED_TO_COMMUNICATE_WITH_THE_API",
          jwtSecret : "JWT_SECRET_USED_TO_GENERATE_LOGGED_IN_TOKENS",
          modules : [actionsManagementModule] // <-- Add the module
        })
    ],
  }).start();
}

```
