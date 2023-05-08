import {
  FlinkAuthPlugin,
  FlinkAuthUser,
  FlinkRequest,
  log,
} from "@flink-app/flink";
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
  rolePermissions: {
    [role: string]: string[];
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
  createPasswordHashAndSalt: (
    password: string
  ) => Promise<{ hash: string; salt: string } | null>;

  /**
   * Validates that provided `password` is same as provided `hash`.
   */
  validatePassword: (
    password: string,
    passwordHash: string,
    salt: string
  ) => Promise<boolean>;
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
}: JwtAuthPluginOptions): JwtAuthPlugin {
  return {
    authenticateRequest: async (req, permissions) =>
      authenticateRequest(req, permissions, rolePermissions, {
        algo,
        secret,
        getUser,
      }),
    createToken: (payload, roles) =>
      createToken({ ...payload, roles }, { algo, secret }),
    createPasswordHashAndSalt: (password: string) =>
      createPasswordHashAndSalt(password, passwordPolicy),
    validatePassword,
  };
}

async function authenticateRequest(
  req: FlinkRequest,
  routePermissions: string | string[],
  rolePermissions: { [x: string]: string[] },
  {
    secret,
    algo,
    getUser,
  }: Pick<JwtAuthPluginOptions, "algo" | "secret" | "getUser">
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

    if (decodedToken) {
      const permissionsArr = Array.isArray(routePermissions)
        ? routePermissions
        : [routePermissions];

      if (permissionsArr && permissionsArr.length > 0) {
        const validPerms = hasValidPermissions(
          decodedToken.roles || [],
          rolePermissions,
          permissionsArr
        );

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
  { secret, algo }: Pick<JwtAuthPluginOptions, "algo" | "secret">
) {
  if (!payload) {
    throw new Error("Cannot create token - payload is missing");
  }

  return jwtSimple.encode(payload, secret, algo);
}

async function createPasswordHashAndSalt(
  password: string,
  passwordPolicy: RegExp
) {
  if (!passwordPolicy.test(password)) {
    log.debug(`Password does not match password policy '${passwordPolicy}'`);
    return null;
  }

  const salt = await genSalt(10);
  const hash = await encrypt(password, salt);
  return { salt, hash };
}

async function validatePassword(
  password: string,
  passwordHash: string,
  salt: string
) {
  const hashCandidate = await encrypt(password, salt);
  return hashCandidate === passwordHash;
}
