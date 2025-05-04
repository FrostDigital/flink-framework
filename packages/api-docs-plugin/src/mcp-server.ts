import { FlinkApp } from "@flink-app/flink";
import type { Request, Response } from "express";

interface SchemaProperty {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
}

interface Endpoint {
    path: string;
    method: string;
    description?: string;
    queryParams?: Array<{ name: string; description?: string; type?: string; required?: boolean }>;
    pathParams?: Array<{ name: string; description?: string }>;
    requestBody?: SchemaProperty[];
    responseBody?: SchemaProperty[];
}

// Helper function to simplify schema conversion
function flattenProperties(properties: Record<string, any>, required: string[] = [], parent = ""): SchemaProperty[] {
    let result: SchemaProperty[] = [];
    for (const [key, value] of Object.entries(properties || {})) {
        const path = parent ? `${parent}.${key}` : key;
        result.push({
            name: path,
            type: value.type,
            description: value.description,
            required: required.includes(key),
        });
        if (value.type === "object" && value.properties) {
            result = result.concat(flattenProperties(value.properties, value.required || [], path));
        }
        if (value.type === "array" && value.items && value.items.type === "object" && value.items.properties) {
            result = result.concat(flattenProperties(value.items.properties, value.items.required || [], `${path}[]`));
        }
    }
    return result;
}

// For creating an Express endpoint that handles MCP requests
export function createMcpHandler(app: FlinkApp<any>) {
    return async (req: Request, res: Response) => {
        try {
            // Get all endpoints from the Flink app
            const endpoints: Endpoint[] = app.handlers.map((handler) => ({
                path: handler.routeProps.path,
                method: handler.routeProps.method!.toUpperCase(),
                description: handler.schema?.reqSchema?.description,
                queryParams: handler.queryMetadata,
                pathParams: handler.paramsMetadata,
                requestBody: handler.schema?.reqSchema?.properties
                    ? flattenProperties(handler.schema.reqSchema.properties, handler.schema.reqSchema.required || [])
                    : undefined,
                responseBody: handler.schema?.resSchema?.properties
                    ? flattenProperties(handler.schema.resSchema.properties, handler.schema.resSchema.required || [])
                    : undefined,
            }));

            // For WebSocket upgrade requests
            if (req.headers.upgrade === "websocket") {
                // Handle WebSocket upgrade (requires additional WebSocket setup)
                res.status(426).send("WebSocket support not yet implemented");
                return;
            }

            // For regular HTTP requests to the MCP endpoint
            if (req.method === "GET") {
                res.json({
                    name: "api-docs-mcp-server",
                    version: "1.0.0",
                    description: "MCP server providing API documentation tools",
                    tools: endpoints.length,
                    endpoints: endpoints.map((e) => ({
                        path: e.path,
                        method: e.method,
                        description: e.description,
                    })),
                });
                return;
            }

            // Handle MCP protocol messages over HTTP POST
            if (req.method === "POST") {
                const { method, params } = req.body;

                // Handle tools/list
                if (method === "tools/list") {
                    const tools = endpoints.map((endpoint) => ({
                        name: `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[/:]/g, "_")}`,
                        description: endpoint.description || `${endpoint.method} ${endpoint.path}`,
                        inputSchema: generateInputSchema(endpoint),
                    }));

                    res.json({ tools });
                    return;
                }

                // Handle tools/call
                if (method === "tools/call") {
                    const { name, arguments: args } = params || {};

                    // Find the corresponding endpoint
                    const endpoint = endpoints.find((e) => `${e.method.toLowerCase()}_${e.path.replace(/[/:]/g, "_")}` === name);

                    if (!endpoint) {
                        res.json({
                            content: [
                                {
                                    type: "text",
                                    text: `Tool not found: ${name}`,
                                },
                            ],
                        });
                        return;
                    }

                    // Build the response with endpoint details
                    let response = `Endpoint Details:\n`;
                    response += `Path: ${endpoint.path}\n`;
                    response += `Method: ${endpoint.method}\n`;

                    if (endpoint.description) {
                        response += `Description: ${endpoint.description}\n`;
                    }

                    if (endpoint.pathParams && endpoint.pathParams.length > 0) {
                        response += `\nPath Parameters:\n`;
                        endpoint.pathParams.forEach((param) => {
                            response += `- ${param.name}: ${param.description || "No description"}\n`;
                        });
                    }

                    if (endpoint.queryParams && endpoint.queryParams.length > 0) {
                        response += `\nQuery Parameters:\n`;
                        endpoint.queryParams.forEach((param) => {
                            response += `- ${param.name}${param.required ? " (required)" : ""}: ${param.type || "string"} - ${
                                param.description || "No description"
                            }\n`;
                        });
                    }

                    if (endpoint.requestBody && endpoint.requestBody.length > 0) {
                        response += `\nRequest Body Schema:\n`;
                        response += JSON.stringify(endpoint.requestBody, null, 2);
                    }

                    if (endpoint.responseBody && endpoint.responseBody.length > 0) {
                        response += `\nResponse Body Schema:\n`;
                        response += JSON.stringify(endpoint.responseBody, null, 2);
                    }

                    res.json({
                        content: [
                            {
                                type: "text",
                                text: response,
                            },
                        ],
                    });
                    return;
                }

                res.status(400).json({
                    error: "Unknown method",
                    details: `Method ${method} is not supported`,
                });
                return;
            }

            res.status(405).send("Method not allowed");
        } catch (error) {
            console.error("MCP handler error:", error);
            res.status(500).send("Internal server error");
        }
    };
}

function generateInputSchema(endpoint: Endpoint) {
    const inputSchema = {
        type: "object",
        properties: {} as Record<string, any>,
        required: [] as string[],
    };

    // Add path parameters
    if (endpoint.pathParams && endpoint.pathParams.length > 0) {
        endpoint.pathParams.forEach((param) => {
            inputSchema.properties[param.name] = {
                type: "string",
                description: param.description || `Path parameter: ${param.name}`,
            };
            inputSchema.required.push(param.name);
        });
    }

    // Add query parameters
    if (endpoint.queryParams && endpoint.queryParams.length > 0) {
        endpoint.queryParams.forEach((param) => {
            inputSchema.properties[param.name] = {
                type: param.type || "string",
                description: param.description || `Query parameter: ${param.name}`,
            };
            if (param.required) {
                inputSchema.required.push(param.name);
            }
        });
    }

    // Add request body
    if (endpoint.requestBody && endpoint.requestBody.length > 0) {
        const requestBodySchema = {
            type: "object",
            properties: {} as Record<string, any>,
            required: [] as string[],
        };

        // Convert flat properties back to nested structure for schema
        endpoint.requestBody.forEach((prop) => {
            const parts = prop.name.split(".");
            let current = requestBodySchema.properties;

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {
                        type: "object",
                        properties: {},
                    };
                }
                current = current[part].properties;
            }

            const lastPart = parts[parts.length - 1];
            current[lastPart] = {
                type: prop.type,
                description: prop.description,
            };

            if (prop.required) {
                requestBodySchema.required.push(parts[0]);
            }
        });

        inputSchema.properties.body = requestBodySchema;
        inputSchema.required.push("body");
    }

    return inputSchema;
}
