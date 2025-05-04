# Build Process for API Docs Plugin

This plugin consists of two main parts:
1. The TypeScript plugin code
2. A React application for the documentation UI

## Directory Structure

```
api-docs-plugin/
├── src/                    # TypeScript plugin source
├── react-app/              # React application source
│   ├── src/                # React components
│   └── dist/               # Built React files (after build)
└── dist/                   # Compiled plugin output
    ├── index.js            # Compiled plugin
    └── react-app/          # Copied React build files
```

## Build Process

The build process follows these steps:

1. **Build React App**: 
   - Runs `npm run build` in the `react-app` directory
   - Outputs files to `react-app/dist`

2. **Compile TypeScript**:
   - Compiles all TypeScript files from `src/` to `dist/`

3. **Copy Assets**:
   - Copies the built React app from `react-app/dist` to `dist/react-app`

## Commands

- `npm run prepare`: Runs the full build process (React + TypeScript + copy)
- `npm run build:react`: Builds only the React app
- `npm run clean`: Removes the dist directory

## How It Works

1. The plugin serves the React app from `dist/react-app` at the `/docs` endpoint
2. The React app fetches API data from `/docs/api`
3. The plugin provides the API data based on registered Flink handlers

## Development

For development, you can run:
- `npm run dev`: Starts a development server
- `npm run watch`: Watches for TypeScript changes

Make sure to build the React app before testing the full plugin.
