// server.js — StoryForge 94 backend entry point
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const eventsRouter = require('./routes/events');
const configRouter = require('./routes/config');
const { startSimulator } = require('./simulator/streams');
const auditLog = require('./store/auditLog');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ── Ensure data directory ────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/events', eventsRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  auditLog.write({ level: 'error', message: err.message, path: req.path });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 StoryForge 94 Server running on http://localhost:${PORT}`);
  console.log(`   Event stream: http://localhost:${PORT}/api/events/stream`);
  console.log(`   Health:       http://localhost:${PORT}/api/health\n`);
  auditLog.write({ level: 'info', message: `Server started on port ${PORT}` });
  // Start auto-simulator after 1 second
  setTimeout(startSimulator, 1000);
});

module.exports = app;
