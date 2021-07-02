import { FlinkRepo  } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { User } from "./schemas/User";
import { UserCreateRes } from "./schemas/UserCreateRes";
import { UserLoginRes } from "./schemas/UserLoginRes";
import { UserProfile } from "./schemas/UserProfile";
import { UserPasswordChangeRes } from "./schemas/UserPasswordChangeRes";
import { UserPasswordResetSettings} from "./schemas/UserPasswordResetSettings"
import { UserPasswordResetStartRes } from "./schemas/UserPasswordResetStartRes"
import { UserPasswordResetCompleteRes } from "./schemas/UserPasswordResetCompleteRes"

export interface genericAuthContext{
    genericAuthPlugin : {

    
        loginUser( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, username : string, password? : string) : Promise<UserLoginRes>,
        createUser( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, username : string, password : string, authentificationMethod : "password" | "sms",  roles : string[], profile : UserProfile ) : Promise<UserCreateRes>,
        changePassword( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, userId : string, newPassword : string) : Promise<UserPasswordChangeRes>,
        passwordResetStart( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, jwtSecret : string, username : string, numberOfDigits? : number, lifeTime? : string) : Promise<UserPasswordResetStartRes>,
        passwordResetComplete( repo : FlinkRepo<any, User>, auth : JwtAuthPlugin, jwtSecret : string, passwordResetToken : string, code : string, newPassword : string) : Promise<UserPasswordResetCompleteRes>         
        repoName : string,
        passwordResetSettings? : UserPasswordResetSettings
    }

}
