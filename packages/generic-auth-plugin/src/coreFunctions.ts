import { FlinkRepo, FlinkAuthUser } from "@flink-app/flink";
import { JwtAuthPlugin, jwtAuthPlugin, JwtAuthPluginOptions } from "@flink-app/jwt-auth-plugin";

import { User } from "./schemas/User";
import { UserCreateRes } from "./schemas/UserCreateRes";
import { UserLoginRes } from "./schemas/UserLoginRes";
import { UserProfile } from "./schemas/UserProfile";
import { UserPasswordChangeRes } from "./schemas/UserPasswordChangeRes";
import { UserPasswordResetStartRes } from "./schemas/UserPasswordResetStartRes";
import { UserPasswordResetCompleteRes } from "./schemas/UserPasswordResetCompleteRes";

import jsonwebtoken from "jsonwebtoken";
import { GenericAuthsmsOptions } from "./genericAuthPluginOptions";

type JwtTokenOpts = {
    secret: string;
    rolePermissions?: { [role: string]: string[] };
    passwordPolicy?: RegExp;
    tokenTTL?: number;
    singleSession?: JwtAuthPluginOptions["singleSession"];
};

export function getJtwTokenPlugin({ secret, rolePermissions, passwordPolicy, tokenTTL, singleSession }: JwtTokenOpts) {
    if (passwordPolicy == undefined) {
        passwordPolicy = /.{1,}$/;
    }
    if (rolePermissions == undefined) {
        rolePermissions = {};
    }
    if (rolePermissions["user"] == null) {
        rolePermissions["user"] = [];
    }
    if (!rolePermissions["user"].includes("authenticated")) rolePermissions["user"].push("authenticated");

    return jwtAuthPlugin({
        secret,
        getUser: (tokenData: any) => {
            return new Promise<FlinkAuthUser>((res) => {
                res({
                    username: tokenData.username,
                    _id: tokenData._id,
                });
            });
        },
        passwordPolicy,
        rolePermissions,
        tokenTTL,
        singleSession,
    });
}

export async function createUser(
    repo: FlinkRepo<any, User>,
    auth: JwtAuthPlugin,
    username: string,
    password: string,
    authentificationMethod: "password" | "sms",
    roles: string[],
    profile: UserProfile,
    createPasswordHashAndSaltMethod?: {
        (password: string): Promise<{ hash: string; salt: string } | null>;
    }
): Promise<UserCreateRes> {
    if (!roles.includes("user")) roles.push("user");

    const existingUser = await repo.getOne({ username: username.toLowerCase() });
    if (existingUser != null) {
        return {
            status: "userExists",
        };
    }
    let userData: Omit<User, "_id"> = {
        username: username.toLowerCase(),
        roles,
        profile,
        authentificationMethod,
        pushNotificationTokens: [],
    };

    if (authentificationMethod == "password") {
        let passwordAndSalt = null;
        if (createPasswordHashAndSaltMethod != null) {
            passwordAndSalt = await createPasswordHashAndSaltMethod(password);
        } else {
            passwordAndSalt = await auth.createPasswordHashAndSalt(password);
        }

        if (passwordAndSalt == null) {
            return {
                status: "passwordError",
            };
        }
        userData.password = passwordAndSalt.hash;
        userData.salt = passwordAndSalt.salt;
    }

    const user = await repo.create(userData);

    const token = await auth.createToken({ username: username.toLowerCase(), _id: user._id }, roles);

    if (user.authentificationMethod == "sms") {
        return {
            status: "success",
        };
    }

    return {
        status: "success",
        user: {
            _id: user._id,
            token: token,
            username: username.toLowerCase(),
        },
    };
}

export async function loginByToken(repo: FlinkRepo<any, User>, auth: JwtAuthPlugin, token: string, code: string, jwtSecret: string): Promise<UserLoginRes> {
    let payload: { type: string; userId: string };
    try {
        payload = jsonwebtoken.verify(token, jwtSecret + ":" + code) as { type: string; userId: string };
    } catch (ex) {
        return { status: "failed" };
    }

    if (payload.type != "smsLogin") {
        return { status: "failed" };
    }

    const user = await repo.getById(payload.userId);
    if (user == null) {
        return { status: "failed" };
    }

    const authToken = await auth.createToken({ username: user.username.toLowerCase(), _id: user._id }, user.roles);

    return {
        status: "success",
        user: {
            _id: user._id,
            username: user.username,
            token: authToken,
            profile: user.profile,
        },
    };
}

export async function loginUser(
    repo: FlinkRepo<any, User>,
    auth: JwtAuthPlugin,
    username: string,
    password: string | undefined,
    validatePasswordMethod?: {
        (password: string, hash: string, salt: string): Promise<boolean>;
    },
    smsOptions?: GenericAuthsmsOptions,
    onSuccessfulLogin?: {
        (user: User): Promise<void>;
    }
): Promise<UserLoginRes> {
    const user = await repo.getOne({ username: username.toLowerCase() });
    if (user == null) {
        return { status: "failed" };
    }

    let valid: boolean = false;

    if (user.authentificationMethod == "password") {
        if (password == null) password = "";

        if (validatePasswordMethod) {
            valid = await validatePasswordMethod(password, <string>user.password, <string>user.salt);

            //If not valid, try to use default auth
            if (!valid) {
                try {
                    valid = await auth.validatePassword(password, <string>user.password, <string>user.salt);
                } catch (ex) {}
            }
        } else {
            valid = await auth.validatePassword(password, <string>user.password, <string>user.salt);
        }
    }
    if (user.authentificationMethod == "sms") {
        if (!smsOptions) throw "SMS options must be specified to use SMS login";
        let code = smsOptions.codeType == "numeric" ? generate(smsOptions.codeLength) : generateString(smsOptions.codeLength);
        smsOptions.smsClient.send({
            to: [user.username],
            from: smsOptions.smsFrom,
            message: smsOptions.smsMessage.replace("{{code}}", code),
        });

        const payload = {
            type: "smsLogin",
            userId: user._id,
        };

        const secret = smsOptions.jwtToken + ":" + code;

        const options: jsonwebtoken.SignOptions = {
            expiresIn: "1h",
        };

        const token = jsonwebtoken.sign(payload, secret, options);

        return {
            status: "success",
            validationToken: token,
        };
    }

    if (valid) {
        const token = await auth.createToken({ username: username.toLowerCase(), _id: user._id }, user.roles);

        if (onSuccessfulLogin) {
            await onSuccessfulLogin(user);
        }

        return {
            status: "success",
            user: {
                _id: user._id,
                username: user.username,
                token,
                profile: user.profile,
            },
        };
    } else {
        return { status: "failed" };
    }
}

export async function changePassword(
    repo: FlinkRepo<any, User>,
    auth: JwtAuthPlugin,
    userId: string,
    newPassword: string,
    createPasswordHashAndSaltMethod?: {
        (password: string): Promise<{ hash: string; salt: string } | null>;
    }
): Promise<UserPasswordChangeRes> {
    const user = await repo.getById(userId);
    if (user == null) {
        return { status: "failed" };
    }

    if (user.authentificationMethod != "password") {
        return { status: "failed" };
    }

    let passwordAndSalt = null;

    if (createPasswordHashAndSaltMethod == null) {
        passwordAndSalt = await auth.createPasswordHashAndSalt(newPassword);
    } else {
        passwordAndSalt = await createPasswordHashAndSaltMethod(newPassword);
    }

    if (passwordAndSalt == null) {
        return {
            status: "passwordError",
        };
    }

    await repo.updateOne(userId, {
        password: passwordAndSalt.hash,
        salt: passwordAndSalt.salt,
    });

    return { status: "success" };
}

export async function passwordResetStart(
    repo: FlinkRepo<any, User>,
    auth: JwtAuthPlugin,
    jwtSecret: string,
    username: string,
    numberOfDigits?: number,
    lifeTime?: string
): Promise<UserPasswordResetStartRes> {
    const user = await repo.getOne({ username: username.toLowerCase() });

    const fakepayload = {
        type: "passwordReset",
        username: username.toLocaleLowerCase(),
    };
    const fakeToken = jsonwebtoken.sign(fakepayload, "fake_payload", { expiresIn: lifeTime });

    if (user == null) {
        return { status: "userNotFound", passwordResetToken: fakeToken };
    }

    if (user.authentificationMethod != "password") {
        return { status: "userNotFound", passwordResetToken: fakeToken };
    }

    if (numberOfDigits == null) numberOfDigits = 6;
    if (lifeTime == null) lifeTime = "1h";

    const payload = {
        type: "passwordReset",
        username: username.toLocaleLowerCase(),
    };
    const code = generate(numberOfDigits);

    const secret = jwtSecret + ":" + code;

    const options: jsonwebtoken.SignOptions = {
        expiresIn: lifeTime,
    };

    const token = jsonwebtoken.sign(payload, secret, options);

    return {
        status: "success",
        passwordResetToken: token,
        code,
        profile: user.profile,
    };
}

export async function passwordResetComplete(
    repo: FlinkRepo<any, User>,
    auth: JwtAuthPlugin,
    jwtSecret: string,
    passwordResetToken: string,
    code: string,
    newPassword: string,
    createPasswordHashAndSaltMethod?: {
        (password: string): Promise<{ hash: string; salt: string } | null>;
    }
): Promise<UserPasswordResetCompleteRes> {
    let payload: { type: string; username: string } = { type: "", username: "" };
    try {
        const secret = jwtSecret + ":" + code;
        payload = <{ type: string; username: string }>jsonwebtoken.verify(passwordResetToken, secret);
    } catch (ex) {
        return { status: "invalidCode" };
    }

    const user = await repo.getOne({ username: payload.username });
    if (user == null) {
        return { status: "userNotFound" };
    }

    if (user.authentificationMethod != "password") {
        return { status: "userNotFound" };
    }

    let passwordAndSalt = null;

    if (createPasswordHashAndSaltMethod == null) {
        passwordAndSalt = await auth.createPasswordHashAndSalt(newPassword);
    } else {
        passwordAndSalt = await createPasswordHashAndSaltMethod(newPassword);
    }

    if (passwordAndSalt == null) {
        return {
            status: "passwordError",
        };
    }

    await repo.updateOne(user._id, {
        password: passwordAndSalt.hash,
        salt: passwordAndSalt.salt,
    });

    return { status: "success" };
}

function generate(n: number): string {
    var add = 1,
        max = 12 - add;

    if (n > max) {
        return generate(max) + generate(n - max);
    }

    max = Math.pow(10, n + add);
    var min = max / 10;
    var number = Math.floor(Math.random() * (max - min + 1)) + min;

    return ("" + number).substring(add);
}

function generateString(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = " ";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}
