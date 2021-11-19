import { Project, SyntaxKind } from "ts-morph";
import {
  addImport,
  getTypeMetadata,
  getTypesToImport,
} from "../src/TypeScriptUtils";

describe("TypeScriptUtils", () => {
  let project: Project;

  beforeEach(async () => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
  });

  describe("addImport", () => {
    it("should add new named import from symbol", () => {
      const fileWithInterface = project.createSourceFile(
        "Foo.ts",
        "export interface Foo {}"
      );

      const targetFile = project.createSourceFile("Bar.ts", "");

      const symbol = fileWithInterface
        .getFirstChildByKindOrThrow(SyntaxKind.InterfaceDeclaration)
        .getSymbolOrThrow();

      addImport(targetFile, symbol);

      expect(targetFile.getImportDeclarations().length).toBe(1);
      expect(targetFile.getImportDeclarations()[0].getText()).toBe(
        `import { Foo } from "./Foo";`
      );
    });
  });

  describe("getTypesToImport", () => {
    it("should get types which needs to be imported", () => {
      const file1 = project.createSourceFile(
        "Foo.ts",
        `
              import Baz from "./Baz";
              
              interface Foo {
    bar: Bar;
  }
  
  interface Bar {
    baz: Baz;
  }
  
  const aVar: {foo: Foo} = { 
    bar: {
      baz: {
        name: "hello"
      } 
    }
  }
  `
      );

      const file2 = project.createSourceFile(
        "Baz.ts",
        `
  import Baz from "./Baz";
  
  interface Baz {
    name: string;
  }
  
  export default Baz;
  `
      );

      const aVar = file1.getVariableDeclarationOrThrow("aVar");

      const typesToImport = getTypesToImport(aVar.getTypeNodeOrThrow());

      expect(typesToImport.length).toBe(1);
      expect(typesToImport[0].getText()).toBe(`import("/Baz").default`);
    });
  });

  describe("getTypeMetadata", () => {
    it("should get type metadata", () => {
      const sf = project.createSourceFile(
        "Foo.ts",
        `
      interface Foo {
        /**
         * This is a comment
         */
        name: string;

        propWithoutComment: string;
      }
      `
      );

      const metadata = getTypeMetadata(
        sf.getFirstChildByKind(SyntaxKind.InterfaceDeclaration)!.getType()
      );

      expect(metadata.length).toBe(2);
      expect(metadata[0].name).toBe("name");
      expect(metadata[0].description).toBe("This is a comment");
      expect(metadata[1].name).toBe("propWithoutComment");
      expect(metadata[1].description).toBeFalsy();
    });
  });
});
