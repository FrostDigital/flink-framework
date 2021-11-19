import { JSONSchema7 } from "json-schema";
import { deRefSchema, getJsDocComment } from "../src/utils";

describe("Utils", () => {
  describe("deref", () => {
    it("should de-ref json schema", () => {
      const dereffedSchema = deRefSchema(
        jsonSchemas.definitions!.GetCar2_10_ResSchema,
        jsonSchemas
      );

      const schema = dereffedSchema as JSONSchema7;

      // @ts-ignore
      expect(schema.properties.engine.type).toBe("object");

      // @ts-ignore
      expect(schema.properties.model.properties.engine.type).toBe("object");

      // @ts-ignore
      expect(schema.properties.tires.items.type).toBe("object");
    });

    it("should de-ref json schema (nested prop)", () => {
      const dereffedSchema = deRefSchema(
        jsonSchemas.definitions!.Login,
        jsonSchemas
      );

      const schema = dereffedSchema as JSONSchema7;

      // @ts-ignore
      expect(schema.properties.user.properties.profile.type).toBe("object");
    });

    it("should de-ref json schema which is an array", () => {
      const dereffedSchema = deRefSchema(
        jsonSchemas.definitions!.Cars,
        jsonSchemas
      );

      const schema = dereffedSchema as JSONSchema7;

      expect(schema.type).toBe("array");

      // @ts-ignore
      expect(schema.items.type).toBe("object");
    });

    it("should de-ref json schema which is an array 2", () => {
      const dereffedSchema = deRefSchema(
        jsonSchemas.definitions!.Cars2,
        jsonSchemas
      );

      const schema = dereffedSchema as JSONSchema7;

      expect(schema.type).toBe("array");

      // @ts-ignore
      expect(schema.items.type).toBe("object");

      // @ts-ignore
      expect(schema.items.properties.model.type).toBe("object");
    });

    it("should de-ref complex json schema", () => {
      const dereffedSchema = deRefSchema(
        jsonSchemasSet2.definitions!.GetStorages_9_ResSchema,
        jsonSchemasSet2
      );

      const schema = dereffedSchema as JSONSchema7;

      expect(schema.type).toBe("object");

      // @ts-ignore
      expect(schema.properties.storages.type).toBe("array");

      // @ts-ignore
      expect(schema.properties.storages.items.properties.metadata.type).toBe(
        "object"
      );
    });
  });

  describe("getJsDocComment", () => {
    it("should strip comment chars and return string", () => {
      const comment = `
/**
 * Hello world
 * This is another line
 * This line contains a * (asterisk)
 */
      `;

      expect(getJsDocComment(comment)).toBe(
        "Hello world\nThis is another line\nThis line contains a * (asterisk)"
      );
    });
  });
});

const jsonSchemas: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $ref: "#/definitions/Schemas",
  definitions: {
    GetCar_9_ResSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
        },
      },
      required: ["model"],
    },
    GetCar2_10_ResSchema: {
      type: "object",
      properties: {
        model: {
          $ref: "#/definitions/CarModel",
        },
        engine: {
          $ref: "#/definitions/CarEngine",
        },
        tires: {
          type: "array",
          items: {
            $ref: "#/definitions/Tire",
          },
        },
      },
      required: ["model", "engine"],
      additionalProperties: false,
    },
    CarModel: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        engine: {
          $ref: "#/definitions/CarEngine",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    CarEngine: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    Tire: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    Cars: {
      type: "array",
      items: {
        $ref: "#/definitions/CarModel",
      },
    },
    Cars2: {
      type: "array",
      items: {
        type: "object",
        properties: {
          model: {
            $ref: "#/definitions/CarModel",
          },
        },
      },
    },

    Login: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["success", "failed", "requiresValidation"],
        },
        user: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            username: {
              type: "string",
            },
            token: {
              type: "string",
            },
            profile: {
              $ref: "#/definitions/UserProfile",
            },
          },
          required: ["_id", "username", "token", "profile"],
          additionalProperties: false,
        },
        validationToken: {
          type: "string",
        },
      },
      required: ["status"],
    },

    UserProfile: {
      type: "object",
    },
  },
};

const jsonSchemasSet2: JSONSchema7 = {
  // $schema: "http://json-schema.org/draft-07/schema#",
  // $ref: "#/definitions/Schemas",
  definitions: {
    Metadata: {
      type: "object",
      properties: {
        created: { type: "string", format: "date-time" },
        updated: { type: "string", format: "date-time" },
      },
      required: ["created"],
      additionalProperties: false,
    },

    GetStorages_9_ResSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        storages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              metadata: { $ref: "#/definitions/Metadata" },
            },
            required: ["_id", "name", "metadata"],
            additionalProperties: false,
          },
        },
      },
      required: ["storages"],
    },

    UserRole: { type: "string", enum: ["user", "admin", "teamLeader"] },
  },
};
