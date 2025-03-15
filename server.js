
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Data file location
const DATA_DIR = process.env.DATA_DIR || './data';
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty trades file if it doesn't exist
if (!fs.existsSync(TRADES_FILE)) {
  fs.writeFileSync(TRADES_FILE, JSON.stringify([]));
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
  res.json({ status: 'ok' });
});

// For React Router - serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
