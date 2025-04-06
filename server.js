
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 4000;

// Handle __dirname in ES module and CommonJS environments
let __dirname;
try {
    // Check if we're in ES module context
    if (typeof __dirname === "undefined") {
        // For ESM
        const __filename = fileURLToPath(import.meta.url);
        __dirname = path.dirname(__filename);
    }
} catch (error) {
    // We're in CommonJS, __dirname is already defined
    console.log("Running in CommonJS mode");
}

// Data file location
const DATA_DIR = process.env.DATA_DIR || "./data";
const TRADES_FILE = path.join(DATA_DIR, "trades.json");
const IDEAS_FILE = path.join(DATA_DIR, "ideas.json");
const STRATEGIES_FILE = path.join(DATA_DIR, "strategies.json");
const SYMBOLS_FILE = path.join(DATA_DIR, "symbols.json");
const LESSONS_FILE = path.join(DATA_DIR, "lessons.json");
const MEDIA_DIR = path.join(DATA_DIR, "media"); // Directory for storing media files

// Ensure data directory exists
console.log(`Ensuring data directory exists: ${DATA_DIR}`);
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory: ${DATA_DIR}`);
}

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    console.log(`Created media directory: ${MEDIA_DIR}`);
}

// Initialize empty files if they don't exist
if (!fs.existsSync(TRADES_FILE)) {
    fs.writeFileSync(TRADES_FILE, JSON.stringify([]));
    console.log(`Initialized empty trades file: ${TRADES_FILE}`);
}

if (!fs.existsSync(IDEAS_FILE)) {
    fs.writeFileSync(IDEAS_FILE, JSON.stringify([]));
    console.log(`Initialized empty ideas file: ${IDEAS_FILE}`);
}

if (!fs.existsSync(STRATEGIES_FILE)) {
    fs.writeFileSync(STRATEGIES_FILE, JSON.stringify([]));
    console.log(`Initialized empty strategies file: ${STRATEGIES_FILE}`);
}

if (!fs.existsSync(SYMBOLS_FILE)) {
    fs.writeFileSync(SYMBOLS_FILE, JSON.stringify([]));
    console.log(`Initialized empty symbols file: ${SYMBOLS_FILE}`);
}

if (!fs.existsSync(LESSONS_FILE)) {
    fs.writeFileSync(LESSONS_FILE, JSON.stringify([]));
    console.log(`Initialized empty lessons file: ${LESSONS_FILE}`);
}

// Configure media storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, MEDIA_DIR);
    },
    filename: (req, file, cb) => {
        // Create unique filename with original extension
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniquePrefix}${ext}`);
    }
});

// File upload middleware
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 }, // Increased to 200MB limit
    fileFilter: (req, file, cb) => {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: "200mb" })); // Increased JSON limit for large data
app.use(express.static("dist")); // Serve static files

// Serve media files
app.use('/media', express.static(MEDIA_DIR));

// API Routes
// IMPORTANT: All API routes are now under /api without any duplication

// API Routes for trades
app.get("/api/trades", (req, res) => {
    try {
        const tradesData = fs.readFileSync(TRADES_FILE, "utf8");
        res.json(JSON.parse(tradesData));
    } catch (error) {
        console.error("Error reading trades:", error);
        res.status(500).json({ error: "Failed to read trades data" });
    }
});

app.put("/api/trades", (req, res) => {
    try {
        fs.writeFileSync(TRADES_FILE, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        console.error("Error writing trades:", error);
        res.status(500).json({ error: "Failed to save trades data" });
    }
});

// API Routes for ideas
app.get("/api/ideas", (req, res) => {
    try {
        const ideasData = fs.readFileSync(IDEAS_FILE, "utf8");
        res.json(JSON.parse(ideasData));
    } catch (error) {
        console.error("Error reading ideas:", error);
        res.status(500).json({ error: "Failed to read ideas data" });
    }
});

app.put("/api/ideas", (req, res) => {
    try {
        fs.writeFileSync(IDEAS_FILE, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        console.error("Error writing ideas:", error);
        res.status(500).json({ error: "Failed to save ideas data" });
    }
});

// API Routes for strategies
app.get("/api/strategies", (req, res) => {
    try {
        const strategiesData = fs.readFileSync(STRATEGIES_FILE, "utf8");
        res.json(JSON.parse(strategiesData));
    } catch (error) {
        console.error("Error reading strategies:", error);
        res.status(500).json({ error: "Failed to read strategies data" });
    }
});

app.put("/api/strategies", (req, res) => {
    try {
        fs.writeFileSync(STRATEGIES_FILE, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        console.error("Error writing strategies:", error);
        res.status(500).json({ error: "Failed to save strategies data" });
    }
});

// API Routes for symbols
app.get("/api/symbols", (req, res) => {
    try {
        const symbolsData = fs.readFileSync(SYMBOLS_FILE, "utf8");
        res.json(JSON.parse(symbolsData));
    } catch (error) {
        console.error("Error reading symbols:", error);
        res.status(500).json({ error: "Failed to read symbols data" });
    }
});

app.put("/api/symbols", (req, res) => {
    try {
        fs.writeFileSync(SYMBOLS_FILE, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        console.error("Error writing symbols:", error);
        res.status(500).json({ error: "Failed to save symbols data" });
    }
});

// API Routes for lessons
app.get("/api/lessons", (req, res) => {
    try {
        const lessonsData = fs.readFileSync(LESSONS_FILE, "utf8");
        res.json(JSON.parse(lessonsData));
    } catch (error) {
        console.error("Error reading lessons:", error);
        res.status(500).json({ error: "Failed to read lessons data" });
    }
});

app.put("/api/lessons", (req, res) => {
    try {
        fs.writeFileSync(LESSONS_FILE, JSON.stringify(req.body));
        res.json({ success: true });
    } catch (error) {
        console.error("Error writing lessons:", error);
        res.status(500).json({ error: "Failed to save lessons data" });
    }
});

// Media upload endpoint
app.post("/api/upload", upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        
        // Return the file path that can be saved in the trade
        const filePath = `/media/${req.file.filename}`;
        res.json({ 
            success: true, 
            filePath,
            fileType: req.file.mimetype,
            isVideo: req.file.mimetype.startsWith('video/')
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// Health check endpoint - now both nested under /api and at the root
app.get("/ping", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/ping", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// For React Router - serve index.html for any unmatched routes
app.get("*", (req, res) => {
    const indexPath = path.join(
        __dirname || process.cwd(),
        "dist",
        "index.html",
    );
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error(`Index file not found at: ${indexPath}`);
        res.status(404).send("Application index file not found");
    }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/ping`);
    console.log(`API health check available at http://localhost:${PORT}/api/ping`);
    console.log(`Media files available at http://localhost:${PORT}/media/`);
});

// Handle process termination
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    process.exit(0);
});
