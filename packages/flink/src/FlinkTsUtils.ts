import { Node, PropertyAssignment, SourceFile, ts, Type } from "ts-morph";
import { HttpMethod, RouteProps } from "./FlinkHttpHandler";
import { log } from "./FlinkLog";
import { sep } from "path";

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
    reqSchema: reqSchemaArg?.getSymbol()?.getName(),
    resSchema: resSchemaArg?.getSymbol()?.getName(),
  };
}

function isValidSchemaType(type: Type<ts.Type>) {
  return type.isAny() || type.isInterface();
}

/**
 * Reads Route props from handler source file.
 */
export function getRoutePropsFromHandlerSourceFile(file: SourceFile) {
  // Inspiration: https://stackoverflow.com/a/61218889

  const objectLiteral = file
    .getVariableDeclarationOrThrow("Route")
    .getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
    .getProperties() as PropertyAssignment[];

  let routeProps: Partial<RouteProps> = {};

  objectLiteral.forEach((ol) => {
    if (Node.isShorthandPropertyAssignment(ol)) {
      // TODO: Have not yet figured out how to do this
      throw new Error(
        "Short hand property assignments in handler Routes is not supported at the moment"
      );
    } else if (Node.isPropertyAssignment(ol)) {
      const initializer = ol.getInitializerOrThrow();

      if (initializer.getKind() === ts.SyntaxKind.PropertyAccessExpression) {
        // @ts-ignore
        routeProps[ol.getName()] = ol.getType().getLiteralValue();
      } else if (
        [
          ts.SyntaxKind.StringLiteral,
          ts.SyntaxKind.TrueKeyword,
          ts.SyntaxKind.FalseKeyword,
        ].includes(initializer.getKind())
      ) {
        // @ts-ignore
        routeProps[ol.getName()] = (initializer as Literals).getLiteralValue();
      } else {
        log.warn("Unhandled route props property: " + ol.getKindName());
      }
    }
  });

  if (!routeProps.path) {
    throw new Error(`Handler ${file.getBaseName()} Props is missing 'path'`);
  }

  if (!routeProps.method) {
    routeProps.method = getHttpMethodFromHandlerName(file.getBaseName());
    if (!routeProps.method) {
      log.error(
        `Handler ${file.getBaseName()} should either be prefixed with HTTP method in its filename, such as 'PostFoo', or have 'method' set in RouteProps`
      );
    }
  }

  return routeProps;
}

/**
 * Get http method from props or convention based on file name
 * if it starts with i.e "GetFoo"
 */
function getHttpMethodFromHandlerName(handlerFilename: string) {
  if (handlerFilename.includes(sep)) {
    const split = handlerFilename.split(sep);
    handlerFilename = split[split.length - 1];
  }

  handlerFilename = handlerFilename.toLocaleLowerCase();

  if (handlerFilename.startsWith(HttpMethod.get)) return HttpMethod.get;
  if (handlerFilename.startsWith(HttpMethod.post)) return HttpMethod.post;
  if (handlerFilename.startsWith(HttpMethod.put)) return HttpMethod.put;
  if (handlerFilename.startsWith(HttpMethod.delete)) return HttpMethod.delete;
}
