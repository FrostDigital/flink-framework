import TypeScriptCompiler from "../src/TypeScriptCompiler";

describe("TypeScriptCompiler", () => {
  let compiler: TypeScriptCompiler;

  beforeAll(async () => {
    await TypeScriptCompiler.clean("spec/mock-project");
    compiler = new TypeScriptCompiler("spec/mock-project");
  });

  it("should get premit diagnostics", () => {
    expect(compiler.getPreEmitDiagnostics()).toBeTrue();
  });

  it("should parse repos and generate file", async () => {
    const generatedFile = await compiler.parseRepos();
    expect(generatedFile.getText()).toContain("CarRepo");
  });

  it("should parse handlers and generate file", async () => {
    const generatedFile = await compiler.parseHandlers();

    expect(generatedFile.getText()).toContain(
      `import { scannedHandlers, HttpMethod } from "@flink-app/flink"`
    );
    expect(generatedFile.getText()).toContain(
      `import * as GetCar_0 from "../src/handlers/GetCar"`
    );
    expect(generatedFile.getText()).toContain(`export const handlers =`);
    expect(generatedFile.getText()).toContain(
      `{routeProps: GetCar_0.Route, handlerFn: GetCar_0.default, assumedHttpMethod: HttpMethod.get, reqSchema: "", resSchema: "GetCar_10_ResSchema"}`
    );
    // expect(generatedFile.getText()).toContain(
    //   `{routeProps: PostCar_5.Route, handlerFn: PostCar_5.default, assumedHttpMethod: HttpMethod.post}`
    // );
  });

  it("should generate start script", async () => {
    const startScript = await compiler.generateStartScript();

    expect(startScript.getText()).toContain(`import "./generatedHandlers";`);
    expect(startScript.getText()).toContain(`import "./generatedRepos";`);
    expect(startScript.getText()).toContain(`import "../src/index";`);
  });
});
