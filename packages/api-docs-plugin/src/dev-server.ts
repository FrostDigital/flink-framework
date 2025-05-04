import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const port = 3001;

// Configure development options
const options = {
    apiPath: "/docs/api"
};

// Load sample data
let sampleData: any;
try {
    sampleData = JSON.parse(fs.readFileSync(path.join(__dirname, "../sample.json"), "utf-8"));
    console.log("Sample data loaded successfully");
} catch (error) {
    console.error("Failed to load sample.json:", error);
    process.exit(1);
}

// Enable CORS for development
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Serve API endpoint
app.get(options.apiPath, (req, res) => {
    console.log(`API request received at ${options.apiPath}`);
    res.json({
        routes: Array.isArray(sampleData) ? sampleData : [sampleData]
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Mock API server running at http://localhost:${port}`);
    console.log(`API endpoint available at http://localhost:${port}${options.apiPath}`);
    console.log("\nTo develop the React app:");
    console.log("1. Keep this server running");
    console.log("2. In another terminal, cd to react-app and run 'npm run dev'");
    console.log("3. Open http://localhost:5173 to see the app");
});
