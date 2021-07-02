import { FlinkApp, HttpMethod } from "@flink-app/flink";
import schemas from "../.flink/schemas.json";
import { userLoginHandler } from "./handlers/UserLogin";
import { userCreateHandler } from "./handlers/UserCreate";
import { getProfileHandler } from "./handlers/UserProfileGet";
import { putUserProfileHandler } from "./handlers/UserProfilePut"; 
import { putUserPasswordHandler } from "./handlers/UserPasswordPut"
import { postPasswordResetStartHandler} from "./handlers/UserPasswordResetStart"
import { postPasswordResetCompleteHandler } from "./handlers/UserPasswordResetComplete";
import { genericAuthPluginOptions } from "./genericAuthPluginOptions";
import { postUserPushRegisterTokenHandler} from "./handlers/UserPushRegisterToken"
import { postUserRemoveTokenHandler } from "./handlers/UserPushRemoveToken"
import { getUserTokenHandler } from "./handlers/UserToken"

export function init(app: FlinkApp<any>, options: genericAuthPluginOptions) {

    if(options.enableRoutes){

        app.addHandler({
                routeProps: {
                method: HttpMethod.post,
                path: "/user/login",
                docs: "Authenticates a user",
                },
                schema: {
                reqSchema: schemas.UserLoginReq,
                resSchema: schemas.UserLoginRes,
                },
            },
            userLoginHandler
        );

        app.addHandler({
                routeProps: {
                method: HttpMethod.post,
                path: "/user/create",
                docs: "Creates a new user",
                },
                schema: {
                reqSchema: schemas.UserCreateReq,
                resSchema: schemas.UserCreateRes,
                },
            },
            userCreateHandler
        );

        app.addHandler({
                routeProps: {
                    method: HttpMethod.get,
                    path: "/user/profile",
                    docs: "Gets the user profile",
                    permissions : "authenticated"
                },
                schema: {
                    resSchema: schemas.UserProfile,
                },
            },
            getProfileHandler

        );


        app.addHandler({
            routeProps: {
                method: HttpMethod.get,
                path: "/user/token",
                docs: "Gets a refreshed token for the user",
                permissions : "authenticated"
            },
            schema: {
                resSchema: schemas.UserTokenRes
            },
        },
        getUserTokenHandler

    );        

        app.addHandler({
                routeProps: {
                    method: HttpMethod.put,
                    path: "/user/profile",
                    docs: "Updates the user profile",
                    permissions : "authenticated"
                },
                schema: {
                    reqSchema: schemas.UserProfile,
                    resSchema: schemas.UserProfile,
                },
            },
            putUserProfileHandler
        );   


        

        app.addHandler({
                routeProps: {
                    method: HttpMethod.put,
                    path: "/user/password",
                    docs: "Updates the user password",
                    permissions : "authenticated"
                },
                schema: {
                    reqSchema: schemas.UserPasswordChangeReq,
                    resSchema: schemas.UserPasswordChangeRes,
                },
            },
            putUserPasswordHandler
        );   


        if(options.enablePasswordReset){

            app.addHandler({
                    routeProps: {
                    method: HttpMethod.post,
                    path: "/user/password/reset",
                    docs: "Start the password reset process for a user",
                    },
                    schema: {
                    reqSchema: schemas.UserPasswordResetStartReq,
                    resSchema: schemas.UserPasswordResetStartRes,
                    },
                },
                postPasswordResetStartHandler
            );
            

            app.addHandler({
                    routeProps: {
                    method: HttpMethod.post,
                    path: "/user/password/reset/complete",
                    docs: "Completes a password reset for a user",
                    },
                    schema: {
                    reqSchema: schemas.UserPasswordResetCompleteReq,
                    resSchema: schemas.UserPasswordResetCompleteRes,
                    },
                },
                postPasswordResetCompleteHandler
            );
            
        }


        if(options.enablePushnotificationTokens){

            app.addHandler({
                    routeProps: {
                        method: HttpMethod.post,
                        path: "/user/push",
                        docs: "Register a push notification on current user",
                        permissions : "authenticated"
                    },
                    schema: {
                        reqSchema: schemas.PushNotificationToken,
                        resSchema: schemas.PushNotificatioNTokenRes,
                    },
                },
                postUserPushRegisterTokenHandler
            );   


            app.addHandler({
                routeProps: {
                    method: HttpMethod.delete,
                    path: "/user/push",
                    docs: "Removes a push notification token from current user",
                    permissions : "authenticated"
                },
                schema: {
                    reqSchema: schemas.PushNotificationToken,
                    resSchema: schemas.PushNotificatioNTokenRes,
                },
            },
            postUserRemoveTokenHandler
        );  

        }
    }




}  

export {};