import {
  FlinkAuthPlugin,
  FlinkAuthUser,
  FlinkRequest,
  log,
} from "@flink-app/flink";
import jwtSimple from "jwt-simple";

const defaultPaths = {
  login: "/login",
  logout: "/logout",
  me: "/me",
};

interface FlinkJwtAuthPluginOptions {
  secret: string;
  algo?: jwtSimple.TAlgorithm;
  getUser: (id: string) => Promise<FlinkAuthUser>;
  paths?: {
    login: string;
    logout: string;
    me: string;
  };
}

/**
 * Configures and creates authentication plugin.
 */
export function jwtAuthPlugin({
  secret,
  getUser,
  algo = "HS256",
  paths,
}: FlinkJwtAuthPluginOptions): FlinkAuthPlugin {
  paths = { ...defaultPaths, ...paths };

  return {
    authenticateRequest: async (req) =>
      authenticateRequest(req, { algo, secret, getUser }),
    createToken: (payload) => createToken(payload, { algo, secret }),
  };
}

async function authenticateRequest(
  req: FlinkRequest,
  {
    secret,
    algo,
    getUser,
  }: Pick<FlinkJwtAuthPluginOptions, "algo" | "secret" | "getUser">
) {
  const token = getTokenFromReq(req);

  if (token) {
    let decodedToken;

    try {
      decodedToken = jwtSimple.decode(token, secret, true, algo);
    } catch (err) {
      log.debug(`Failed to decode token: ${err}`);
      decodedToken = null;
    }

    if (decodedToken) {
      const user = await getUser(decodedToken.id);
      log.debug(
        `Failed to authenticate request - user ${decodedToken.id} not found`
      );

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
  { secret, algo }: Pick<FlinkJwtAuthPluginOptions, "algo" | "secret">
) {
  if (!payload) {
    throw new Error("Cannot create token - payload is missing");
  }

  return jwtSimple.encode(payload, secret, algo);
}
