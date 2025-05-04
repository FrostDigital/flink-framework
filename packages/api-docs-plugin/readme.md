# Flink API Docs Plugin

A FLINK plugin that automatically generates beautiful API documentation based on your app's registered routes and schemas. This plugin provides a modern, Swagger-like interface for exploring and understanding your API endpoints.

## Features

-   🚀 Automatic API documentation generation
-   🔍 Detailed request/response schema documentation
-   🤖 MCP (Model Context Protocol) support for AI assistants

## Installation

Install the plugin to your Flink app project:

```bash
npm i -S @flink-app/api-docs-plugin
```

## Usage

Add and configure the plugin in your app startup (typically in your root `index.ts`):

```typescript
import { apiDocPlugin } from "@flink-app/api-docs-plugin";

function start() {
    new FlinkApp<AppContext>({
        name: "My app",
        plugins: [
            // Register plugin with custom options
            apiDocPlugin({
                title: "API Docs: My app",
                path: "/docs", // Optional: defaults to "/docs"
                apiPath: "/docs/api", // Optional: defaults to "/docs/api"
                mcp: {
                    enabled: true, // Optional: defaults to true
                    path: "/docs/mcp", // Optional: defaults to "/docs/mcp"
                },
            }),
        ],
    }).start();
}
```

## Configuration Options

The plugin accepts the following configuration options:

| Option        | Type    | Default     | Description                                    |
| ------------- | ------- | ----------- | ---------------------------------------------- |
| `path`        | string  | `/docs`     | The URL path where the documentation is served |
| `apiPath`     | string  | `/docs/api` | The URL path where the API data is served      |
| `name`        | string  | -           | Custom name for the plugin instance            |
| `title`       | string  | `API Docs`  | The title displayed in the documentation UI    |
| `mcp.enabled` | boolean | `true`      | Enable/disable MCP server                      |
| `mcp.path`    | string  | `/docs/mcp` | The URL path where the MCP endpoint is served  |

## MCP (Model Context Protocol) Support

The plugin includes built-in MCP support, allowing AI assistants and other tools to programmatically access your API documentation.

### What is MCP?

MCP (Model Context Protocol) is a standard protocol that enables AI assistants to interact with external tools and services. With MCP enabled, AI assistants can:

-   Discover all available API endpoints
-   Understand request/response schemas
-   Generate example API calls
-   Help with API integration and debugging

### MCP Configuration

```typescript
apiDocPlugin({
    mcp: {
        enabled: true, // Enable MCP server (default: true)
        path: "/docs/mcp", // MCP endpoint path (default: "/docs/mcp")
    },
});
```

### MCP Endpoints

The MCP server exposes these endpoints:

-   `GET /docs/mcp` - Returns MCP server information
-   `POST /docs/mcp` - Handles MCP protocol messages

Each API endpoint is exposed as an MCP tool with the naming convention:

-   `get_users__id` for `GET /users/:id`
-   `post_auth_login` for `POST /auth/login`

See [MCP.md](./MCP.md) for detailed MCP documentation.

## How It Works

The plugin automatically:

1. Sets up a static file server at the specified path (defaults to `/docs`)
2. Creates an API endpoint at `/docs/api` that exposes route information
3. Serves a React application that fetches and displays your API documentation
4. Groups endpoints by resource for better organization
5. Displays detailed request/response schemas with proper TypeScript types
6. Sets up an MCP server endpoint for AI assistant integration

## Development

For local development of the API documentation UI:

1. Start the mock API server:

    ```bash
    npm run dev:mock-api
    ```

2. In another terminal, start the React development server:

    ```bash
    npm run dev:react
    ```

3. Open http://localhost:5173 in your browser

The development setup includes hot-reloading for the React application, allowing you to see changes instantly as you modify the UI components.

## Architecture

The plugin consists of three main parts:

1. **Express Plugin**: Integrates with your Flink application to serve the documentation
2. **React Application**: Modern UI that displays the API documentation
3. **MCP Server**: Provides programmatic access to API documentation for AI assistants

The React app uses:

-   Tailwind CSS for styling
-   TypeScript for type safety
-   Vite for fast development and building

## Requirements

-   Node.js v20.17.0 or higher (as specified in root .nvmrc)
-   A Flink application with Express initialized

## UI Features

-   **Method Badges**: Color-coded HTTP method indicators (GET, POST, PUT, DELETE, etc.)
-   **Expandable Sections**: Click on endpoints to view detailed information
-   **Schema Tables**: Well-formatted tables showing request/response properties
-   **Type Information**: Clear display of property types and requirements
-   **Description Support**: Built-in support for endpoint and property descriptions
-   **Mock Endpoint Indicators**: Visual indicators for mocked endpoints
-   **Responsive Design**: Works seamlessly on desktop and mobile devices
-   **TypeScript Interface Generation**: Copy TypeScript interfaces for request/response bodies

## Building

To build the complete plugin:

```bash
npm run prepare
```

This will:

1. Build the React application
2. Compile TypeScript files
3. Copy all necessary assets to the dist directory

The built plugin can then be published to npm and used in any Flink application.
