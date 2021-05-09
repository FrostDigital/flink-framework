import ts, { SourceFile } from "typescript";

const genericsRegexp = /.*<(.*?)>/;

type ReqResSchemas = {
    reqSchema: string | undefined, resSchema: string | undefined
}

/**
 * Derives schema that is part of handlers generic type argument
 * by inspecting nodes in handler source file.
 */
export function getSchemaFromHandlerSourceFile(
    program: ts.Program,
    file: SourceFile
): ReqResSchemas {
    // TODO: This is a quick and dirty implementation, someone with knowledge in ts compiler should make this better

    // Below crashes if typechecker has not been invoked, dunno why
    program.getTypeChecker();

    let result: ReqResSchemas = { reqSchema: undefined, resSchema: undefined };

    function traverse(node: ts.Node) {
        if (ts.isVariableStatement(node)) {
            const text = node.getText().replaceAll(" ", "").replace("\t", "");

            if (text.includes(":GetHandler<")) {
                const m = text.match(genericsRegexp);

                if (m && m[1]) {
                    const typeParams = m[1].split(",");
                    // 2nd type param is response schema in GetHandler
                    result.resSchema = typeParams[1];
                }
            } else if (text.includes(":Handler<")) {
                const m = text.match(genericsRegexp);

                if (m && m[1]) {
                    const typeParams = m[1].split(",");

                    // 2nd type param is req schema and 3rd is res schema
                    result.reqSchema = typeParams[1];
                    result.resSchema = typeParams[2];
                }
            }
        }
    }

    ts.forEachChild(file, traverse);

    return result;
}
