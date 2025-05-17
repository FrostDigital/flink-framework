#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// API docs plugin API root
const apiRoot = process.argv[2] || "http://localhost:3333/docs/api";
const name = process.argv[3] || "API Docs";

// Create server instance
const server = new McpServer({
    name,
    version: "1.0.0",
});

server.tool("api-endpoints", "Get all documented API endpoints and its request and response bodies.", async () => {
    const apiDocs = await makeFlinkApiDocsRequest<any>();

    if (!apiDocs) {
        throw new Error("Failed to fetch API docs");
    }

    return {
        content: [
            {
                mimeType: "application/json",
                text: JSON.stringify(apiDocs, null, 2),
                type: "text",
            },
        ],
    };
});

async function makeFlinkApiDocsRequest<T>(): Promise<T | null> {
    const headers = {
        Accept: "application/json",
    };

    try {
        const response = await fetch(apiRoot, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json()) as T;
    } catch (error) {
        console.error("Error making request:", error);
        return null;
    }
}

// Connect the server to the transport
async function main() {
    try {
        // Create a stdio transport
        const transport = new StdioServerTransport();

        // Connect the server to the transport
        await server.connect(transport);

        console.log(JSON.stringify({ error: "Flink API MCP server started successfully" }));
    } catch (error) {
        console.error("Failed to start Flink API MCP server:", error);
        process.exit(1);
    }
}

// Start the server
main();
