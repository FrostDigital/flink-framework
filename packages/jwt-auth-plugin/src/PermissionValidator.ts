import { log } from "@flink-app/flink";

/**
 * Checks if provided role has permission to access route
 * based on its permissions.
 *
 * @param roles logged in user role(s)
 * @param rolePermissions map containing permissions by role
 * @param routePermissions permission(s) required by route
 * @returns
 */
export function hasValidPermissions(
  roles: string[],
  rolePermissions: { [x: string]: string[] },
  routePermissions: string[]
) {
  if (routePermissions.includes("*")) {
    return roles.length > 0;
  }

  if (routePermissions.length === 0) {
    return true;
  }

  for (const role of roles) {
    const thisRolesPermissions = rolePermissions[role];

    if (!thisRolesPermissions) {
      log.warn(`Role '${role}' does not have any permissions defined`);
      continue;
    }

    if (thisRolesPermissions.includes("*")) {
      return true;
    }

    if (
      routePermissions.every((routePerm) =>
        thisRolesPermissions.includes(routePerm)
      )
    ) {
      return true;
    }
  }

  return false;
}
