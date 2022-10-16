export interface UserCreateRes {
    status: "success" | "error" | "userExists" | "passwordError";
    user?: {
        _id: string;
        username: string;
        token: string;
    };
}
