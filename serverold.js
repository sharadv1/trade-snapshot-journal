
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;
const { fileURLToPath } = require('url');

console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

// Handle __dirname in ES module and CommonJS environments
let __dirname;
try {
  // Check if we're in ES module context
  if (typeof __dirname === 'undefined') {
    // For ESM
    const __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  }
} catch (error) {
  // We're in CommonJS, __dirname is already defined
  console.log('Running in CommonJS mode');
}

// Data file location
const DATA_DIR = process.env.DATA_DIR || './data';
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');

// Ensure data directory exists
console.log(`Ensuring data directory exists: ${DATA_DIR}`);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory: ${DATA_DIR}`);
}

// Initialize empty trades file if it doesn't exist
if (!fs.existsSync(TRADES_FILE)) {
  fs.writeFileSync(TRADES_FILE, JSON.stringify([]));
  console.log(`Initialized empty trades file: ${TRADES_FILE}`);
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For handling large requests with images
app.use(express.static('dist')); // Serve static files

// API Routes
app.get('/api/trades', (req, res) => {
  try {
    const tradesData = fs.readFileSync(TRADES_FILE, 'utf8');
    res.json(JSON.parse(tradesData));
  } catch (error) {
    console.error('Error reading trades:', error);
    res.status(500).json({ error: 'Failed to read trades data' });
  }
});

app.put('/api/trades', (req, res) => {
  try {
    fs.writeFileSync(TRADES_FILE, JSON.stringify(req.body));
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing trades:', error);
    res.status(500).json({ error: 'Failed to save trades data' });
  }
});

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For React Router - serve index.html for any unmatched routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname || process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`Index file not found at: ${indexPath}`);
    res.status(404).send('Application index file not found');
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/ping`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
