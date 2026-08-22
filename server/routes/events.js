// routes/events.js — Event ingestion, SSE streaming, and history endpoints

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const eventStore = require('../store/eventStore');
const auditLog = require('../store/auditLog');
const scorer = require('../engine/scorer');
const narrator = require('../engine/narrator');
const correlator = require('../engine/correlator');

// ── POST /api/events/ingest ───────────────────────────────────────────────────
// Accept a single event or array of events, score + narrate them, then store.
router.post('/ingest', (req, res) => {
  const startTime = Date.now();
  let raw = req.body;

  if (!raw) return res.status(400).json({ error: 'Request body required' });
  if (!Array.isArray(raw)) raw = [raw];
  if (raw.length === 0) return res.status(400).json({ error: 'At least one event required' });
  if (raw.length > 500) return res.status(400).json({ error: 'Batch too large (max 500)' });

  // Validate and enrich each event
  const enriched = raw.map(e => ({
    id: e.id || uuidv4(),
    timestamp: e.timestamp || new Date().toISOString(),
    source: e.source || 'unknown',
    type: e.type || 'unknown',
    service: e.service || 'unknown',
    region: e.region || 'unknown',
    severity: Math.min(Math.max(parseInt(e.severity) || 1, 1), 5),
    userImpact: Math.max(parseInt(e.userImpact) || 0, 0),
    metadata: e.metadata || {}
  }));

  auditLog.write({ level: 'info', step: 'ingest', message: `Received ${enriched.length} events via HTTP`, count: enriched.length });

  // Score → Correlate → Narrate
  const scored = scorer.scoreAndRank(enriched);
  const correlated = correlator.annotate(scored);
  const narrated = narrator.narrateBatch(correlated);

  // Store
  eventStore.addBatch(narrated);

  const elapsed = Date.now() - startTime;
  auditLog.write({ level: 'info', step: 'ingest_complete', message: `Ingested ${narrated.length} events in ${elapsed}ms`, elapsed_ms: elapsed });

  narrated.forEach(e => {
    auditLog.write({ level: 'info', step: 'event_triaged', eventId: e.id, source: e.source, type: e.type, priority: e.priority, score: e.score });
  });

  res.status(201).json({
    ingested: narrated.length,
    elapsed_ms: elapsed,
    events: narrated
  });
});

// ── GET /api/events/stream — SSE real-time stream ────────────────────────────
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send heartbeat every 15s to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 15000);

  // Send initial snapshot of recent events
  const recent = eventStore.getRanked(30);
  res.write(`event: snapshot\ndata: ${JSON.stringify({ type: 'snapshot', events: recent, stats: eventStore.getStats() })}\n\n`);

  // Subscribe to new events
  const unsubscribe = eventStore.subscribe((event) => {
    res.write(`event: event\ndata: ${JSON.stringify(event)}\n\n`);
    // Also send updated stats
    res.write(`event: stats\ndata: ${JSON.stringify(eventStore.getStats())}\n\n`);
  });

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
  });
});

// ── GET /api/events/history — Replay last triage decisions ───────────────────
router.get('/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const source = req.query.source;
  const priority = req.query.priority;

  let events = eventStore.getRanked(limit);

  if (source) events = events.filter(e => e.source === source);
  if (priority) events = events.filter(e => e.priority === priority);

  res.json({
    total: events.length,
    stats: eventStore.getStats(),
    events
  });
});

// ── GET /api/events/:id — Single event with audit trail ──────────────────────
router.get('/:id', (req, res) => {
  const event = eventStore.getById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const trail = auditLog.readForEvent(req.params.id);
  res.json({ event, auditTrail: trail });
});

module.exports = router;
