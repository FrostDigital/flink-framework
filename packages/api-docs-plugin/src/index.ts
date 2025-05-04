import { FlinkApp, FlinkPlugin } from "@flink-app/flink";
import path from "path";
import express from "express";
import { createMcpHandler } from "./mcp-server";

export type McpConfig = {
    /**
     * Enable MCP server
     * Defaults to false
     */
    enabled?: boolean;

    /**
     * Path to where MCP endpoint can be accessed
     * Defaults to "/docs/mcp"
     */
    path?: string;
};

export type ApiDocOptions = {
    /**
     * Path to where api docs can be accessed
     * Defaults to "/docs"
     */
    path?: string;

    /**
     * Path to where route and schemas are fetched from.
     * Defaults to "/docs/api"
     */
    apiPath?: string;

    /**
     * Name of plugin
     */
    name?: string;

    /**
     * Title of API Docs, shown to end user who accesses API docs in browser.
     */
    title?: string;

    /**
     * MCP (Model Context Protocol) configuration
     */
    mcp?: McpConfig;
};

export const apiDocPlugin = (options: ApiDocOptions = {}): FlinkPlugin => {
    return {
        id: "apiDocs",
        init: (app) => init(app, options),
    };
};

function init(app: FlinkApp<any>, options: ApiDocOptions) {
    const { expressApp, handlers } = app;

    if (!expressApp) {
        // should not happen
        throw new Error("Express app not initialized");
    }

    const staticPath = path.resolve(__dirname, "react-app");
    expressApp?.use(options.path || "/docs", express.static(staticPath) as any);

    expressApp?.get(options.apiPath || "/docs/api", (req, res) => {
        const sortedHandlers = handlers.sort((routeA, routeB) => routeA.routeProps.path.localeCompare(routeB.routeProps.path));
        res.json({ routes: sortedHandlers });
    });

    // Set up MCP server if enabled
    if (options.mcp?.enabled !== false) {
        // Default to enabled
        const mcpPath = options.mcp?.path || "/docs/mcp";
        const mcpHandler = createMcpHandler(app);

        // Handle all HTTP methods for MCP endpoint
        expressApp?.all(mcpPath, mcpHandler as any);

        console.log(`MCP server enabled at ${mcpPath}`);
    }
}

// Re-export MCP-related functions
export { createMcpHandler } from "./mcp-server";
