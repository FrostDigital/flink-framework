import {
  ImportDeclarationStructure,
  Node,
  OptionalKind,
  SourceFile,
  Symbol,
  SyntaxKind,
  ts,
  Type,
} from "ts-morph";
import { getJsDocComment } from "./utils";

/**
 * Recursively iterates node children to return list of types that is
 * used in node tree which is not located in same file and hence
 * needs to be imported.
 *
 * Declared types of those are returned.
 */
export function getTypesToImport(node: Node<ts.Node>) {
  const typeRefIdentifiers = node
    .getDescendantsOfKind(SyntaxKind.TypeReference)
    .filter(
      (typeRefNode) => !!typeRefNode.getFirstChildIfKind(SyntaxKind.Identifier)
    )
    .map((typeRefNode) =>
      typeRefNode.getFirstChildIfKindOrThrow(SyntaxKind.Identifier)
    );

  const typesToImport: Type<ts.Type>[] = [];

  for (const typeRefIdentifier of typeRefIdentifiers) {
    const typeSymbol = typeRefIdentifier.getSymbolOrThrow();

    const declaredType = typeSymbol.getDeclaredType();
    const declaration = declaredType.getSymbol()?.getDeclarations()[0];

    if (!declaration) {
      continue; // should not happen, right?
    }

    if (declaration.getSourceFile() !== node.getSourceFile()) {
      typesToImport.push(declaration.getSymbolOrThrow().getDeclaredType());
    } else {
      typesToImport.push(...getTypesToImport(declaration));
    }
  }

  return typesToImport;
}

export function addImport(toSourceFile: SourceFile, symbol: Symbol) {
  const symbolDeclaration = symbol.getDeclarations()[0];

  if (!symbolDeclaration) {
    throw new Error(
      "Missing declaration for symbol " + symbol.getFullyQualifiedName()
    );
  }

  const importName = symbol.getEscapedName();
  const symbolSourceFile = symbolDeclaration.getSourceFile();

  const isDefaultExport = symbol
    .getDeclaredType()
    .getText()
    .endsWith(".default");

  const importDec = toSourceFile
    .getImportDeclarations()
    .find(
      (importDeclarataion) =>
        importDeclarataion.getModuleSpecifierSourceFile() === symbolSourceFile
    );

  if (importDec) {
    // File already has import to file
    if (isDefaultExport) {
      if (!importDec.getDefaultImport()) {
        importDec.setDefaultImport(importName);
      }
    } else {
      if (
        !importDec
          .getNamedImports()
          .find((specifier) => specifier.getText() === importName)
      ) {
        importDec.addNamedImport(importName);
      }
    }
  } else {
    // Add new import declaration
    toSourceFile.addImportDeclaration({
      moduleSpecifier:
        toSourceFile.getRelativePathAsModuleSpecifierTo(symbolSourceFile),
      defaultImport: isDefaultExport ? symbol.getEscapedName() : undefined,
      namedImports: isDefaultExport ? undefined : [symbol.getEscapedName()],
    });
  }
}

/**
 * Adds imports to modules where provided symbols resides.
 * Imports are added to provided source file.
 * @param toSourceFile
 * @param symbols
 */
export function addImports(toSourceFile: SourceFile, symbols: Symbol[]) {
  const importsByModuleSpecifier = new Map<
    string,
    { defaultImportName?: string; namedImports: string[] }
  >();

  for (const symbol of symbols) {
    const symbolDeclaration = symbol.getDeclarations()[0];

    if (!symbolDeclaration) {
      throw new Error(
        "Missing declaration for symbol " + symbol.getFullyQualifiedName()
      );
    }

    const importName = symbol.getDeclaredType().isInterface()
      ? getInterfaceName(symbol)
      : symbol.getEscapedName();

    const symbolSourceFile = symbolDeclaration.getSourceFile();
    const isDefaultExport = symbol
      .getDeclaredType()
      .getText()
      .endsWith(".default");

    const moduleSpecifier =
      toSourceFile.getRelativePathAsModuleSpecifierTo(symbolSourceFile);

    let aImport = importsByModuleSpecifier.get(moduleSpecifier);

    if (!aImport) {
      importsByModuleSpecifier.set(moduleSpecifier, {
        defaultImportName: isDefaultExport ? importName : undefined,
        namedImports: isDefaultExport ? [] : [importName],
      });
    } else {
      if (isDefaultExport) {
        aImport.defaultImportName = importName;
      } else if (!aImport.namedImports.includes(importName)) {
        aImport.namedImports.push(importName);
      }
    }
  }

  toSourceFile.addImportDeclarations(
    Array.from(importsByModuleSpecifier.entries()).map(
      ([
        moduleSpecifier,
        aImport,
      ]): OptionalKind<ImportDeclarationStructure> => ({
        moduleSpecifier,
        defaultImport: aImport.defaultImportName,
        namedImports: aImport.namedImports.length
          ? aImport.namedImports
          : undefined,
      })
    )
  );
}

/**
 * Helper to get the default export, if any, from a source file.
 * @param sf
 * @returns
 */
export function getDefaultExport(sf: SourceFile) {
  const exportAssignment = sf.getFirstDescendantByKind(
    SyntaxKind.ExportAssignment
  );

  if (exportAssignment) {
    const identifier = exportAssignment.getFirstChildByKind(
      SyntaxKind.Identifier
    );

    if (identifier) {
      return identifier.getSymbolOrThrow().getDeclarations()[0];
    } else {
      return exportAssignment.getFirstChild();
    }
  }
}

/**
 * Returns name of interface from interface symbol.
 *
 * @param symbol
 * @returns
 */
export function getInterfaceName(symbol: Symbol) {
  const declaration = symbol.getDeclarations()[0];

  if (!declaration) {
    throw new Error("Missing declaration of interface symbol");
  }

  return declaration
    .getFirstChildByKindOrThrow(SyntaxKind.Identifier)
    .getText();
}

export function getSymbolOrAlias(type: Type<ts.Type>) {
  return type.getAliasSymbol() || type.getSymbol();
}

export function getTypeMetadata(type: Type<ts.Type>) {
  if (["void", "any"].includes(type.getText())) {
    return [];
  }

  const symbol = getSymbolOrAlias(type);

  if (!symbol) {
    throw new Error("Could not get type symbol for type: " + type.getText());
  }

  const [declaration] = symbol.getDeclarations();

  if (!declaration) {
    throw new Error("Could not get declaration for type: " + type.getText());
  }

  return declaration
    .getChildrenOfKind(SyntaxKind.PropertySignature)
    .map((prop) => {
      const description = getJsDocComment(
        prop.getLeadingCommentRanges()[0]?.getText() || ""
      );

      return {
        description,
        name: prop.getName(),
      };
    });
}
