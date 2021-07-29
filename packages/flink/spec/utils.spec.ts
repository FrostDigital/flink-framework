import { JSONSchema7 } from "json-schema";
import { deRefSchema } from "../src/utils";

describe("Utils", () => {
  describe("deref", () => {
    it("should de-ref json schema", () => {
      const dereffedSchema = deRefSchema(
        jsonSchemas.definitions!.GetCar2_10_ResSchema,
        jsonSchemas
      );

      const schema = dereffedSchema as JSONSchema7;

      console.log(JSON.stringify(schema, null, 2));
      // @ts-ignore
      expect(schema.properties.engine.type).toBe("object");

      // @ts-ignore
      expect(schema.properties.model.properties.engine.type).toBe("object");

      // @ts-ignore
      expect(schema.properties.tires.items.type).toBe("object");
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
    GetCarWithArraySchema_8_ResSchema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          model: {
            type: "string",
          },
        },
        required: ["model"],
        additionalProperties: false,
      },
    },
    GetCarWithArraySchema2_8_ResSchema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          car: {
            type: "object",
            properties: {
              model: {
                type: "string",
              },
            },
            required: ["model"],
            additionalProperties: false,
          },
        },
        required: ["car"],
        additionalProperties: false,
      },
    },
    GetCarWithArraySchema3_8_ResSchema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          car: {
            type: "object",
            properties: {
              model: {
                type: "string",
              },
            },
            required: ["model"],
            additionalProperties: false,
          },
          year: {
            type: "number",
          },
        },
        required: ["car", "year"],
        additionalProperties: false,
      },
    },
    GetCarWithLiteralSchema_8_ResSchema: {
      type: "object",
      properties: {
        car: {
          type: "object",
          properties: {
            model: {
              type: "string",
            },
          },
          required: ["model"],
          additionalProperties: false,
        },
      },
      required: ["car"],
      additionalProperties: false,
    },
    GetCarWithLiteralSchema2_8_ResSchema: {
      type: "object",
      properties: {
        car: {
          type: "object",
          properties: {
            nestedCar: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                },
              },
              required: ["model"],
              additionalProperties: false,
            },
          },
          required: ["nestedCar"],
          additionalProperties: false,
        },
      },
      required: ["car"],
      additionalProperties: false,
    },
    GetCarWithSchemaInFile_9_ResSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
        },
      },
      required: ["model"],
      additionalProperties: false,
    },
    GetCarWithSchemaInFile2_10_ResSchema: {
      type: "object",
      properties: {
        car: {
          type: "object",
          properties: {
            model: {
              type: "string",
            },
          },
          required: ["model"],
          additionalProperties: false,
        },
      },
      required: ["car"],
      additionalProperties: false,
    },
    ManuallyAddedHandler_7_ReqSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
        },
      },
      required: ["model"],
    },
    ManuallyAddedHandler2_9_ReqSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
        },
      },
      required: ["model"],
    },
    PostCar_8_ReqSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
        },
      },
      required: ["model"],
    },
    PostCar_8_ResSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
        },
      },
      required: ["model"],
    },
    PutCar_8_ReqSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
        },
      },
      required: ["model"],
    },
  },
};
