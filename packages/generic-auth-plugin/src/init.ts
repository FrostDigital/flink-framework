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


    if(options.enableUserCreation == null) options.enableUserCreation = true; 
    if(options.enableProfileUpdate == null) options.enableProfileUpdate = true;
    if(options.enablePasswordUpdate == null) options.enablePasswordUpdate = true;
    if(options.baseUrl == null) options.baseUrl = "/user"

    if(options.enableRoutes){

        app.addHandler({
                routeProps: {
                method: HttpMethod.post,
                path: options.baseUrl  + "/login",
                docs: "Authenticates a user",
                },
                schema: {
                reqSchema: schemas.UserLoginReq,
                resSchema: schemas.UserLoginRes,
                },
            },
            userLoginHandler
        );
        if(options.enableUserCreation){
            app.addHandler({
                    routeProps: {
                    method: HttpMethod.post,
                    path: options.baseUrl  + "/create",
                    docs: "Creates a new user",
                    },
                    schema: {
                    reqSchema: schemas.UserCreateReq,
                    resSchema: schemas.UserCreateRes,
                    },
                },
                userCreateHandler
            );
        }

        app.addHandler({
                routeProps: {
                    method: HttpMethod.get,
                    path: options.baseUrl  + "/profile",
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
                path: options.baseUrl  + "/token",
                docs: "Gets a refreshed token for the user",
                permissions : "authenticated"
            },
            schema: {
                resSchema: schemas.UserTokenRes
            },
        },
        getUserTokenHandler

    );        

        if(options.enableProfileUpdate){
            app.addHandler({
                    routeProps: {
                        method: HttpMethod.put,
                        path: options.baseUrl  + "/profile",
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
        }  


        
        if(options.enablePasswordUpdate){
            app.addHandler({
                    routeProps: {
                        method: HttpMethod.put,
                        path: options.baseUrl  + "/password",
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
        }


        if(options.enablePasswordReset){

            app.addHandler({
                    routeProps: {
                    method: HttpMethod.post,
                    path: options.baseUrl  + "/password/reset",
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
                    path: options.baseUrl  + "/password/reset/complete",
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


        if(options.enablePushNotificationTokens){

            app.addHandler({
                    routeProps: {
                        method: HttpMethod.post,
                        path: options.baseUrl  + "/push",
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
                    path: options.baseUrl  + "/push",
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