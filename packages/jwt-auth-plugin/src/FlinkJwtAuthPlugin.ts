import { FlinkAuthPlugin, FlinkAuthUser, FlinkRequest, log } from "@flink-app/flink";
import jwtSimple from "jwt-simple";
import { encrypt, genSalt } from "./BcryptUtils";
import { hasValidPermissions } from "./PermissionValidator";

/**
 * Minimum eight characters, at least one letter and one number
 * https://stackoverflow.com/a/21456918
 */
const defaultPasswordPolicy = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export interface JwtAuthPluginOptions {
    secret: string;
    algo?: jwtSimple.TAlgorithm;
    getUser: (tokenData: any) => Promise<FlinkAuthUser>;
    passwordPolicy?: RegExp;
    tokenTTL?: number;
    rolePermissions: {
        [role: string]: string[];
    };
    /**
     * If set only one session will be allowed per user, meaning
     * that if a user logs in from another device, the previous session will be invalidated.
     *
     * This requires a database, cache or similar to store the session data. Implement
     * callbacks for this.
     */
    singleSession?: {
        /**
         * The key in the token payload that holds the user id.
         * Defaults to `_id`.
         */
        userIdKeyInTokenPayload?: string;
        /**
         * Callback to validate if a session is valid based on the token.
         * If callback return false the session is considered invalid and the
         * user will be logged out.
         */
        isSessionValid: (token: string, decodedToken: any) => Promise<boolean>;
        /**
         * Creates a new session for the user. The session should be stored in a database
         * or similar and the implementation should handle the case where a session already
         * exists for the user and then remove it.
         *
         * It is up to the implementation to handle errors and return false if the session
         * could not be created. If so the user will not be logged in.
         */
        setUserSession: (userId: string, token: string) => Promise<boolean>;
    };
}

export interface JwtAuthPlugin extends FlinkAuthPlugin {
    /**
     * Encodes and returns JWT token that includes provided payload.
     *
     * The payload can by anything but should in most cases be and object that
     * holds user information including an identifier such as the username or id.
     */
    createToken: (payload: any, roles: string[]) => Promise<string>;

    /**
     * Generates new password hash and salt for provided password.
     *
     * This method should be used when setting a new password. Both hash and salt needs
     * to be saved in database as both are needed to validate the password.
     *
     * Returns null if password does not match configured `passwordPolicy`.
     */
    createPasswordHashAndSalt: (password: string) => Promise<{ hash: string; salt: string } | null>;

    /**
     * Validates that provided `password` is same as provided `hash`.
     */
    validatePassword: (password: string, passwordHash: string, salt: string) => Promise<boolean>;
}

/**
 * Configures and creates authentication plugin.
 */
export function jwtAuthPlugin({
    secret,
    getUser,
    rolePermissions,
    algo = "HS256",
    passwordPolicy = defaultPasswordPolicy,
    tokenTTL = 1000 * 60 * 60 * 24 * 365 * 100, //Defaults to hundred year
    singleSession,
}: JwtAuthPluginOptions): JwtAuthPlugin {
    return {
        authenticateRequest: async (req, permissions) =>
            authenticateRequest(req, permissions, rolePermissions, {
                algo,
                secret,
                getUser,
                singleSession,
            }),
        createToken: (payload, roles) => createToken({ ...payload, roles }, { algo, secret, tokenTTL, singleSession }),
        createPasswordHashAndSalt: (password: string) => createPasswordHashAndSalt(password, passwordPolicy),
        validatePassword,
    };
}

async function authenticateRequest(
    req: FlinkRequest,
    routePermissions: string | string[],
    rolePermissions: { [x: string]: string[] },
    { secret, algo, getUser, singleSession }: Pick<JwtAuthPluginOptions, "algo" | "secret" | "getUser" | "singleSession">
) {
    const token = getTokenFromReq(req);

    if (token) {
        let decodedToken;

        try {
            decodedToken = jwtSimple.decode(token, secret, false, algo);
        } catch (err) {
            log.debug(`Failed to decode token: ${err}`);
            decodedToken = null;
        }

        if (singleSession) {
            try {
                const isValid = await singleSession.isSessionValid(token, decodedToken);
                if (!isValid) {
                    return false;
                }
            } catch (err) {
                log.warn(`Failed to validate session`, err);
                return false;
            }
        }

        if (decodedToken) {
            const permissionsArr = Array.isArray(routePermissions) ? routePermissions : [routePermissions];

            if (permissionsArr && permissionsArr.length > 0) {
                const validPerms = hasValidPermissions(decodedToken.roles || [], rolePermissions, permissionsArr);

                if (!validPerms) {
                    return false;
                }
            }

            const user = await getUser(decodedToken);

            req.user = user;
            return true;
        }
    }
    return false;
}

function getTokenFromReq(req: FlinkRequest) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const [, token] = authHeader.split("Bearer ");
        return token;
    }
    return;
}

async function createToken(
    payload: any,
    { secret, algo, tokenTTL, singleSession }: Pick<JwtAuthPluginOptions, "algo" | "secret" | "tokenTTL" | "singleSession">
) {
    if (!payload) {
        throw new Error("Cannot create token - payload is missing");
    }

    const newToken = jwtSimple.encode({ exp: _calculateExpiration(tokenTTL || 1000 * 60 * 60 * 24 * 365 * 100), ...payload }, secret, algo);

    if (singleSession) {
        // Retrieve userId from payload using the configured key or default to `_id`
        const userIdFromPayload = payload[singleSession.userIdKeyInTokenPayload || "_id"];

        if (!userIdFromPayload) {
            throw new Error(`Cannot create token - userId is missing in payload`);
        }

        // Invoke callback to store the session, we assume that implementation will handle
        // the case where a session already exists for the user and remove it.
        const success = await singleSession.setUserSession(userIdFromPayload, newToken);

        if (!success) {
            throw new Error(`Failed to set user session`);
        }
    }

    return newToken;
}

function _calculateExpiration(expiresInMs: number) {
    return Math.floor((Date.now() + expiresInMs) / 1000);
}

async function createPasswordHashAndSalt(password: string, passwordPolicy: RegExp) {
    if (!passwordPolicy.test(password)) {
        log.debug(`Password does not match password policy '${passwordPolicy}'`);
        return null;
    }

    const salt = await genSalt(10);
    const hash = await encrypt(password, salt);
    return { salt, hash };
}

async function validatePassword(password: string, passwordHash: string, salt: string) {
    const hashCandidate = await encrypt(password, salt);
    return hashCandidate === passwordHash;
}
