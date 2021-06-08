import { Project } from "ts-morph";
import { getSchemaFromHandlerSourceFile } from "../src/FlinkTsUtils";

describe("FlinkTsUtils", () => {
  let projectValid: Project;
  let projectInvalid: Project;

  beforeEach(async () => {
    projectValid = new Project({
      compilerOptions: {
        esModuleInterop: true,
      },
    });
    projectValid.addSourceFilesAtPaths("./spec/mock-project/**/*.ts");

    projectInvalid = new Project({
      compilerOptions: {
        esModuleInterop: true,
      },
    });
    projectInvalid.addSourceFilesAtPaths("./spec/mock-project-invalid/**/*.ts");
  });

  it("should get schemas from Handler", () => {
    const { reqSchema, resSchema } = getSchemaFromHandlerSourceFile(
      projectValid.getSourceFileOrThrow("spec/mock-project/handlers/PostCar.ts")
    );

    expect(reqSchema).toBe("Car");
    expect(resSchema).toBe("Car");
  });

  it("should get schemas GetHandler", () => {
    const { reqSchema, resSchema } = getSchemaFromHandlerSourceFile(
      projectValid.getSourceFileOrThrow("spec/mock-project/handlers/GetCar.ts")
    );

    expect(reqSchema).toBeUndefined();
    expect(resSchema).toBe("Car");
  });

  it("should throw error if schemas is not interfaces in schemas dir", () => {
    try {
      getSchemaFromHandlerSourceFile(
        projectInvalid.getSourceFileOrThrow(
          "spec/mock-project-invalid/handlers/HandlerWithInvalidSchemas.ts"
        )
      );
      fail();
    } catch (err) {
      expect(err + "").toContain("contains invalid request schema");
    }
  });
});
