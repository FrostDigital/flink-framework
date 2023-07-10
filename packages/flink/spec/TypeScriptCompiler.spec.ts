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
        compiler.emit();

        expect(generatedFile.getText()).toContain(`import { autoRegisteredHandlers, HttpMethod } from "@flink-app/flink"`);
        expect(generatedFile.getText()).toContain(`import * as GetCar_0 from "../src/handlers/GetCar"`);
        expect(generatedFile.getText()).toContain(`export const handlers =`);

        expect(generatedFile.getText()).toContain(`"importName":"GetCar_0"`);
        expect(generatedFile.getText()).toContain(`"moduleSpecifier":"../src/handlers/GetCar"`);
        expect(generatedFile.getText()).toContain(`"schemasToGenerate":{"reqSchemaType":"","resSchemaType":"GetCar_16_ResSchema"}`);
        expect(generatedFile.getText()).toContain(`"__file":"GetCar.ts"`);
        expect(generatedFile.getText()).toContain(`"__query":[{"description":"For pagination","name":"page"}]`);
        expect(generatedFile.getText()).toContain(`"__params":[{"description":"","name":"id"}]`);
    });

    it("should generate start script", async () => {
        const startScript = await compiler.generateStartScript();

        expect(startScript.getText()).toContain(`import "./generatedHandlers";`);
        expect(startScript.getText()).toContain(`import "./generatedRepos";`);
        expect(startScript.getText()).toContain(`import "../src/index";`);
    });
});
