import { SourceFile, ts, Type } from "ts-morph";

type ReqResSchemas = {
  reqSchema: string | undefined;
  resSchema: string | undefined;
};

/**
 * Derives schema that is part of handlers generic type argument
 * by inspecting nodes in handler source file.
 */
export function getSchemaFromHandlerSourceFile(
  file: SourceFile
): ReqResSchemas {
  const handlerFnExport = file
    .getDefaultExportSymbolOrThrow()
    .getDeclarations()[0];

  const handlerFnType = handlerFnExport
    .getSymbolOrThrow()
    .getTypeAtLocation(handlerFnExport);

  const isHandlerWithoutReqBody = !handlerFnType
    .getText()
    .includes(".Handler<");

  const typeArgs = handlerFnType.getAliasTypeArguments();

  const reqSchemaArg = !isHandlerWithoutReqBody ? typeArgs[1] : undefined;
  const resSchemaArg = typeArgs[isHandlerWithoutReqBody ? 1 : 2];

  if (reqSchemaArg && !isValidSchemaType(reqSchemaArg)) {
    throw new Error(
      `Handler ${
        file.compilerNode.fileName
      } contains invalid request schema. Schema must be an interface or type that resides in 'src/schemas/' directory. Instead detected type '${reqSchemaArg.getText()}'`
    );
  }

  if (resSchemaArg && !isValidSchemaType(resSchemaArg)) {
    throw new Error(
      `Handler ${
        file.compilerNode.fileName
      } contains invalid response schema. Schema must be an interface or type that resides in 'src/schemas/' directory. Instead detected type '${resSchemaArg.getText()}'`
    );
  }

  return {
    reqSchema: reqSchemaArg?.getSymbolOrThrow().getName(),
    resSchema: resSchemaArg?.getSymbolOrThrow().getName(),
  };
}

function isValidSchemaType(type: Type<ts.Type>) {
  return type.isAny() || type.isInterface();
}
