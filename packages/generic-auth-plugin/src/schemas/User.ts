import { PushNotificationToken} from "./PushNotificationToken";
import { UserProfile } from "./UserProfile";

export interface User {
    _id: string;
    username: string;

    password?: string;
    salt? : string;

    roles: string[];
    
    authentificationMethod : "password" | "sms";
    profile : UserProfile;
    pushNotificationTokens : Array<PushNotificationToken>
};
