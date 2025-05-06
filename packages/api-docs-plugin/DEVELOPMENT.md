# Development Guide for API Docs Plugin

This guide explains how to develop the API Docs Plugin React app.

## Prerequisites

- Node.js installed (see root .nvmrc for version)
- Dependencies installed in both the plugin root and react-app directories:
  ```bash
  npm install
  cd react-app && npm install
  ```

## Development Setup

The development setup consists of two servers:

1. **Mock API Server** (port 3001): Serves sample API data
2. **Vite Dev Server** (port 5173): Serves the React app with hot-reloading

## Running the Development Environment

1. Start the mock API server:
   ```bash
   npm run dev:mock-api
   ```

2. In another terminal, start the React dev server:
   ```bash
   npm run dev:react
   ```

3. Open http://localhost:5173 in your browser

The React app will fetch data from the mock API server through Vite's proxy configuration.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:mock-api` | Start the mock API server |
| `npm run dev:react` | Start the React development server |
| `npm run build:react` | Build the React app for production |
| `npm run prepare` | Build everything for production |
| `npm run clean` | Remove all build artifacts |

## Modifying Sample Data

To test different API structures, edit `sample.json` and restart the mock API server.

## Building for Production

To build the complete plugin:

```bash
npm run prepare
```

This will:
1. Build the React app
2. Compile TypeScript
3. Copy assets to the dist directory

The built plugin will serve the React app statically in production.
