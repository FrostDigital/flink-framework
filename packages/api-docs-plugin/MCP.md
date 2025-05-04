# MCP (Model Context Protocol) Support

The API Docs plugin includes built-in support for the Model Context Protocol (MCP), allowing AI assistants and other tools to programmatically access API documentation.

## Configuration

MCP is enabled by default. You can configure it through the plugin options:

```typescript
import { apiDocPlugin } from "@flink-app/api-docs-plugin";

const plugin = apiDocPlugin({
  // ... other options
  mcp: {
    enabled: true,  // Default: true
    path: "/docs/mcp"  // Default: "/docs/mcp"
  }
});
```

To disable MCP:

```typescript
const plugin = apiDocPlugin({
  mcp: {
    enabled: false
  }
});
```

## Using the MCP Server

### HTTP Endpoint

The MCP server exposes an HTTP endpoint at the configured path (default: `/docs/mcp`).

#### GET Request

Returns information about the MCP server:

```bash
curl http://localhost:3000/docs/mcp
```

Response:
```json
{
  "name": "api-docs-mcp-server",
  "version": "1.0.0",
  "description": "MCP server providing API documentation tools",
  "tools": 15
}
```

#### POST Request

Handles MCP protocol messages. The server supports the following MCP methods:

- `tools/list`: Lists all available API endpoint tools
- `tools/call`: Executes a tool to get detailed information about an API endpoint

### Available Tools

Each API endpoint in your Flink application is exposed as an MCP tool with the naming convention:

```
{method}_{path}
```

Where:
- `method` is the HTTP method in lowercase (get, post, put, delete, etc.)
- `path` has slashes and colons replaced with underscores

For example:
- `GET /users/:id` becomes `get_users__id`
- `POST /auth/login` becomes `post_auth_login`

### Tool Inputs

Each tool accepts inputs based on the API endpoint's requirements:

1. **Path Parameters**: Required string inputs for each path parameter
2. **Query Parameters**: Optional inputs based on the query parameter specifications
3. **Request Body**: A `body` object input for endpoints that accept request bodies

### Tool Outputs

When called, tools return detailed information about the endpoint including:

- Path and HTTP method
- Description (if available)
- Path parameters with descriptions
- Query parameters with types and descriptions
- Request body schema
- Response body schema

## Example Usage with MCP Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Create a client and connect to the MCP server
const client = new Client({
  name: "api-docs-client",
  version: "1.0.0",
});

// List available tools
const tools = await client.request({
  method: "tools/list"
});

// Call a specific tool
const result = await client.request({
  method: "tools/call",
  params: {
    name: "get_users__id",
    arguments: {
      id: "123"
    }
  }
});
```

## Integration with AI Assistants

The MCP server allows AI assistants like Claude to:

1. Discover all available API endpoints
2. Understand the structure and requirements of each endpoint
3. Provide accurate information about request/response schemas
4. Generate example API calls
5. Help with API integration and debugging

This enables more effective AI assistance for developers working with your API.
