# Generic Auth Plugin Docs

A FLINK plugin that provides a generic and easy to use user system.

This plugin is dependent on other flink plugins:

- [jwt-auth-plugin](https://github.com/FrostDigital/flink-framework/tree/main/packages/jwt-auth-plugin)
- [email-plugin](https://github.com/FrostDigital/flink-framework/tree/main/packages/email-plugin)

This plugin enables the following functionalities:

- User creation
- User login
- Change user password
- Password reset routine (with email)
- User profile
- Push notification token management

Plugin can both be used by accessing core functions by calling them directly from your code, or by using the embedded API endpoints.

## Installation

Install plugin to your flink app project:

```
npm i -S @flink-app/generic-auth-plugin
```

## Setup

The setup of this plugin contains a few different steps. Please follow each steps before trying to use the plugin.

### Step 1 - Adding a user repo

The plugin needs a repo to store the users in.

Add this repo to your project by first adding `src/repos/UserRepo.ts`:

```
import { FlinkRepo } from "@flink-app/flink";
import { Ctx } from "../Ctx";
import { User } from "@flink-app/generic-auth-plugin"
class UserRepo extends FlinkRepo<Ctx, User> {}

export default UserRepo;
```

And add the repo to your ApplicationContext `src/Ctx.ts`:

```
import { FlinkContext } from "@flink-app/flink";
import UserRepo from "./repos/UserRepo";

export interface Ctx extends FlinkContext {
  repos: {
    userRepo : UserRepo
  };
}
```

### Step 2 - Configure auth to your app

Create a configured instance of JwtAuthPlugin by using the helper function `getJtwTokenPlugin()` and configure auth property of the FlinkApp in `index.ts`

```
import { FlinkApp } from "@flink-app/flink";
import { Ctx } from "./Ctx";

import { getJtwTokenPlugin } from "@flink-app/generic-auth-plugin"
const authPlugin = getJtwTokenPlugin("secret");

function start() {
  var app = new FlinkApp<Ctx>({
    name: "My flink app",
    debug: true,
    auth : authPlugin,
    db: {
      uri: "mongodb://localhost:27017/my-flink-app",
    },
    plugins: [

    ],
  })
  app.start();
}

start();
```

Se details and configuration for getJtwTokenPlugin() below.

### Step 3 - Initiate the plugin

```
import { FlinkApp } from "@flink-app/flink";
import { Ctx } from "./Ctx";

import { getJtwTokenPlugin, genericAuthPlugin } from "@flink-app/generic-auth-plugin"

const authPlugin = getJtwTokenPlugin("secret");

function start() {
  var app = new FlinkApp<Ctx>({
    name: "My flink app",
    debug: true,
    auth : authPlugin,
    db: {
      uri: "mongodb://localhost:27017/my-flink-app",
    },
    plugins: [
      genericAuthPlugin({
        repoName : "userRepo",
        usernameFormat : /.{1,}$/, //Regex to validate username
        enableRoutes : true, //Set true to enable API-endpoints
        enablePasswordReset : true,
        enablePushNotificationTokens : true,
        passwordResetSettings : {
          email : {
              from_address : "from@host.xxx",
              subject : "Your password reset code",
              html : "To reset your password use the code {{code}}",
          },
          code : {
             numberOfDigits : 8,
             lifeTime : "1h", //npm package
             jwtSecret : "Secret used by password reset"
           }
        }
      }),
    ],
  })
  app.start();
}
start();
```

| Parameter      | Description                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------ |
| lifeTime       | expressed in seconds or a string describing a time span [zeit/ms](https://github.com/vercel/ms). |
| subject / html | expressed in [handlebars](https://handlebarsjs.com/)                                             |

#### Handlebars context

Context used when processing the handlebars template for subject and html is:

```
{
    username, //Username of user
    code, //The code for the password reset
    profile, //Profile of the user
}
```

### getJtwTokenPlugin()

The function have the following definition:

```
getJtwTokenPlugin(secret: string, rolePermissions?: { [role: string]: string[]; } | undefined, passwordPolicy?: RegExp | undefined): JwtAuthPlugin
```

| Parameter       | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| secret          | A secret string that will be used to encrypt the jwt-token      |
| rolePermissions | An object with roles as key and arrays of permissions as values |
| passwordPolicy  | Regex used to validate password                                 |

#### rolePermissions

The rolePermissions parameter specifies which roles have which permissions. Example:

```
{
  "normal_user" : ["read", "list"],
  "admin" : ["read", "list", "write"]
}
```

In this plugin the role `user` with the permission `authenticated` is added automatically. This permission is used to require authenticated user to access a route.

## Making authenticated requests

After logging in by calling `user/login` any subsequent calls should contain the Bearer Authentification token header like this:

```
Authorization: Bearer <token>
```

## Limit access to your own handlers

To limit the access to your own handler, specify the "permission" property of the RouteProps of your handler.

To limit access to your handler to any user, modify the Route like this:

```
export const Route: RouteProps = {
  path: "/sample/url",
  permission : "authenticated"
};
```

To limit access to your handler to a specific permission, specify that permission to the Route like this:

```
export const Route: RouteProps = {
  path: "/sample/url",
  permission : "my_permission"
};
```

## Using API-endpoints

### POST /user/create

Creates a new user.

#### Request data:

```
{
  "username" : "demo@test.com",
  "password" : "12345678",
  "profile" : {
      "age" : 20
  }
}
```

#### Response example

```
{
  "data": {
    "status": "success"
    "user": {
      "_id": "id...",
      "token": "token...",
      "username": "demo@test.com"
    }
  }
}
```

#### Errors

| Code          | Description                                       |
| ------------- | ------------------------------------------------- |
| error         | Internal unknown error                            |
| userExists    | User already exists                               |
| passwordError | Password not accepted / not meeting requirements  |
| usernameError |  Username not accepted / not meeting requirements |

### POST /user/login

Logs a user in.

#### Request data:

```
{
  "username" : "demo@test.com",
  "password" : "12345678"
}
```

#### Response example

```
{
  "data": {
    "status": "success"
    "user": {
      "_id": "id...",
      "username": "demo@test.com",
      "token": "token...",
      "profile": {
        "age": 20
      }
    }
  }
}
```

#### Errors

| Code   | Description                  |
| ------ | ---------------------------- |
| failed | Invalid username or password |

### POST /user/password/reset

Initiates a password reset. Username must be in form of an e-mail for the password reset to work.

#### Request data:

```
{
  "username" : "demo@test.com"
}
```

#### Response example

```
{
  "data": {
    "status": "success"
    "passwordResetToken": "token to use later"
  }
}
```

#### Errors

| Code         | Description    |
| ------------ | -------------- |
| userNotFound | User not found |

### POST /user/password/reset/complete

Completes a password reset by supplying the passwordRestToken received from step 1, the code from the email sent to the user and the new password.

#### Request data:

```
{
  "passwordResetToken" : "token to use later",
  "code" : "12345678",
  "password" : "new password"
}
```

#### Response example

```
{
  "data": {
    "status": "success"
  }
}
```

#### Errors

| Code          | Description                                        |
| ------------- | -------------------------------------------------- |
| invalidCode   | Invalid validation code                            |
| passwordError | Password not accepted / does not meet requirements |
| userNotFound  | User not found                                     |

### PUT /user/password

Updates password of the current user. Request needs authentication.

#### Request data:

```
{
  "password" : "12345678"
}
```

#### Response example

```
{
  "data": {
    "status": "success"
  }
}
```

#### Errors

| Code          | Description                                        |
| ------------- | -------------------------------------------------- |
| failed        | Internal unknown error                             |
| passwordError | Password not accepted / does not meet requirements |

### GET /user/profile

Gets the user profile of the current user. Request needs authentication.

#### Response example

```
{
  "data": {
    "age": 20
  }
}
```

### PUT /user/profile

Updates profile of the current user. Request needs authentication.

#### Request data:

```
{
  "age" : "21",
  "city" : "Stockholm"
}
```

#### Response example

```
{
  "data": {
    "age": "21",
    "city": "Stockholm"
  }
}
```

### POST /user/push

Adds a push notification token to the user. Request needs authentication.

#### Request data:

```
{
  "deviceId" : "xxx",
  "token" : "token..."
}
```

#### Response example

```
{
  "data": {
    "status": "success"
  }
}
```

### DELETE /user/push

Removes a push notification token from the user. Request needs authentication.

#### Request data:

```
{
  "deviceId" : "xxx",
  "token" : "token..."
}
```

#### Response example

```
{
  "data": {
    "status": "success"
  }
}
```

### GET /user/token

Get a refreshed token for the current user. Request needs authentication.

User need to refresh his token if roles or username have been changed.

#### Response example

```
{
  "data": {
    "token": "token..."
  }
}
```

## Using plugin functions

As an alternative to use the included API-endpoints you might use the supplied core functions from this plugin to manage some basic tasks.

After initilizing this plugin, these functions are exposed in the app context:

```
ctx.plugins.genericAuthPlugin.loginUser( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, username : string, password? : string) : Promise<UserLoginRes>
```

```
ctx.plugins.genericAuthPlugin.createUser( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, username : string, password : string, authentificationMethod : "password" | "sms",  roles : string[], profile : UserProfile ) : Promise<UserCreateRes>
```

```
ctx.plugins.genericAuthPlugin.changePassword( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, userId : string, newPassword : string) : Promise<UserPasswordChangeRes>
```

```
ctx.plugins.genericAuthPlugin.passwordResetStart( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, jwtSecret : string, username : string, numberOfDigits? : number, lifeTime? : string) : Promise<UserPasswordResetStartRes>
```

```
ctx.plugins.genericAuthPlugin.passwordResetComplete( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, jwtSecret : string, passwordResetToken : string, code : string, newPassword : string) : Promise<UserPasswordResetCompleteRes>
```

## Deleting users, changing roles and more..

You can always interact directly with the userRepo to modify you users.

Please remember to refresh the users token after changing vital parts of a user.

## Using alternativ password and hash functions

You can specify your own methods to generate hash and salt or to verify a password.

To do this, simply specify the `createPasswordHashAndSaltMethod` and/or `validatePasswordMethod` options on plugin initilizing. Like this:

```
//This is just a dummy on storing password in plain text. STRONGLY NOT RECOMMENDED.

genericAuthPlugin({
  createPasswordHashAndSaltMethod : (password) => {
      return new Promise((resolve) => {
        resolve({ hash : password, salt : "" });
      })
  },
  validatePasswordMethod : (password, hash, salt) => {
      return new Promise((resolve) => {
        resolve(password == hash);
      })
  }
})
```

When `validatePasswordMethod` is specified, that method will be used to validate the password. If that method returns false, the default validation will try as well. This will make it possible to use both default password hashes and alternative ones.

### How to validate old Aquro / Aplexa passwords?

If you are using this plugin to verify old Aquro / Aplexa passwords, you can simply do this by specifying `validatePasswordMethod` and use the same hash-function as Aquro Platform.

#### Install required plugin

```
npm install --save password-hash
npm install --save-dev @types/password-hash
```

#### Update plugin initialization

```
import passwordHash from "password-hash";

genericAuthPlugin({
  validatePasswordMethod : (password, hash, salt) => {
      return new Promise((resolve) => {
        resolve(passwordHash.verify(password, hash));
      })
    }
})
```

## Enabling management-api functions

This plugin supports the [management-api-plugin](https://github.com/FrostDigital/flink-framework/tree/main/packages/management-api-plugin) structure to expose management apis.

The management API is used by [flink-admin](https://github.com/FrostDigital/flink-admin). So to enable managing of app users in flink-admin, you need to exponse this plugins management api functions.

To do this, first install the managemnet-api-plugin and then get the management module from this plugin.

```
import { GetManagementModule  } from "@flink-app/generic-auth-plugin"

const genericAuthManagementModule =  GetManagementModule(
  {
    ui : true, //Enable UI for this module in flink-admin-portal
    uiSettings : {
       title : "App users", //Title of this module
       enableUserEdit, : true //Make it possible to edit the user
       enableUserCreate, : true //Make it possible to create new users
       enableUserDelete, : true //Make it possible to delete the user
       enableUserView, : true //Make it possible to view a user
    }
  }
)
```

Finally add the management module to the list of modules in the managementApiPlugin config:

```

function start() {
  new FlinkApp<Ctx>({
    name: "My flink app",
    debug: true,
    auth : authPlugin,
    loader: (file: any) => import(file),
    db: {
      uri: "mongodb://localhost:27017/my-flink-app",
    },
    plugins: [
      genericAuthPlugin({
        repoName : "userRepo",
      }),
      managementApiPlugin({
        token : "TOKEN",
        jwtSecret : "SECRET",
        modules : [
          genericAuthManagementModule
        ]
      })
    ],
  }).start();
}
```

### Enable user viewing

To make it possible to view data for a user, you will need to first enable the `enableUserView` flag. 

You can also provide a function that returns the data that should be shown of the user. 
This function can also be extended to return a list of buttons that will be added to the toolbar. 


```
import { GetManagementModule  } from "@flink-app/generic-auth-plugin"

const genericAuthManagementModule =  GetManagementModule(
  {
    ui : true, //Enable UI for this module in flink-admin-portal
    uiSettings : {
       title : "App users", //Title of this module
       enableUserEdit, : true //Make it possible to edit the user
       enableUserCreate, : true //Make it possible to create new users
       enableUserDelete, : true //Make it possible to delete the user
       enableUserView, : true //Make it possible to view a user
    },
    userView: {
        getData(user: User) {
     
            let data: {
                [key: string]: string
            } = {
                'E-mail': user.username,
                'Profile property' : user.profile.Property.toString()
            }

            let buttons: {
                text: string
                url: string
            }[] = []

            buttons.push({
                    text: 'Visit google',
                    url: 'https://www.google.com',
              })


            return {
                buttons,
                data,
            }
        },
    },    
  }
)
```



### Make it possible to edit profile properites

To make it possible to edit profile properties when editing users, you must expose the JSON-schema of the profile.

To do this, follow these steps:

#### Step 1:

Create a Schema file for your profile properties, eg. schemas/ProfileProperties.ts

#### Step 2:

Configure flink to generate schema files by editing package.json file and replace

```
    "flink:generate": "flink generate"
```

to:

```
    "flink:generate": "flink generate && flink generate-schema"
```

#### Step 3:

Restart your flink app (to generate the JSON-schemeas)

#### Step 4:

Import the JSON-schema and pass it to the `GetManagementModule` function.

```
import { GetManagementModule  } from "@flink-app/generic-auth-plugin"
import schemas from "../.flink/schemas.json";

const genericAuthManagementModule =  GetManagementModule(
  {
    ui : true, //Enable UI for this module in flink-admin-portal
    profileSchema : schemas.ProfileProperties,
    uiSettings : {
       title : "App users", //Title of this module
       enableUserEdit, : true //Make it possible to edit the user
       enableUserCreate, : true //Make it possible to create new users
       enableUserDelete, : true //Make it possible to delete the user
    }
  }
)
```

Please note that only string and enum property types can be edited from the flink-admin interface.

✅ Do:

```
export interface ProfileProperties{
    name : string;
    city : string;
    gender : "male" | "female" | "any";
}
```

❌ Dont:

```
type myType = {
    hello : string,
    world : string
}

export interface Profile{
    name : string;
    type : myType
}
```
