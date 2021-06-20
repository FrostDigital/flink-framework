import { hasValidPermissions } from "../src/PermissionValidator";

describe("PermissionValidator", () => {
  it("should validate permissions if *", () => {
    const valid = hasValidPermissions(
      ["user"],
      {
        user: ["foo", "*"],
      },
      ["bar"]
    );

    expect(valid).toBe(true);
  });

  it("should validate permissions if match", () => {
    const valid = hasValidPermissions(
      ["user"],
      {
        user: ["foo"],
      },
      ["foo"]
    );

    expect(valid).toBe(true);
  });

  it("should not validate permissions if no match", () => {
    const valid = hasValidPermissions(
      ["user"],
      {
        user: ["foo"],
      },
      ["bar"]
    );

    expect(valid).toBe(false);
  });

  it("should not validate permissions if role permissions are missing", () => {
    const valid = hasValidPermissions(["user"], {}, ["bar"]);

    expect(valid).toBe(false);
  });

  it("should not validate permissions if only partial permission is matching", () => {
    const valid = hasValidPermissions(
      ["user"],
      {
        user: ["foo"],
      },
      ["foo", "bar"]
    );

    expect(valid).toBe(false);
  });

  it("should validate if public route", () => {
    const valid = hasValidPermissions([], {}, []);
    expect(valid).toBe(true);
  });

  it("should validate if any authenticated user is allowed", () => {
    const valid = hasValidPermissions(["user"], {}, ["*"]);
    expect(valid).toBe(true);
  });

  it("should not validate if any authenticated user is allowed but user not logged in", () => {
    const valid = hasValidPermissions([], {}, ["*"]);
    expect(valid).toBe(false);
  });
});
