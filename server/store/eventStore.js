// store/eventStore.js — In-memory circular buffer with JSON persistence
const fs = require('fs');
const path = require('path');

const PERSIST_FILE = path.join(__dirname, '../data/events.json');
const MAX_EVENTS = 1000;

// In-memory store
let events = [];
// SSE subscriber callbacks
const subscribers = new Set();

// ── Load persisted events on startup ─────────────────────────────────────────
function loadFromDisk() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const raw = fs.readFileSync(PERSIST_FILE, 'utf8');
      events = JSON.parse(raw);
      console.log(`[EventStore] Loaded ${events.length} events from disk.`);
    }
  } catch (e) {
    console.warn('[EventStore] Could not load persisted events:', e.message);
    events = [];
  }
}

function saveToDisk() {
  try {
    // Only save last 200 events for quick replay
    const toSave = events.slice(-200);
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(toSave, null, 2), 'utf8');
  } catch (e) {
    console.warn('[EventStore] Could not persist events:', e.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

function add(event) {
  events.push(event);
  // Trim to max size
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  saveToDisk();
  // Notify all SSE subscribers
  subscribers.forEach(cb => {
    try { cb(event); } catch (e) { /* subscriber may have disconnected */ }
  });
  return event;
}

function addBatch(newEvents) {
  newEvents.forEach(e => {
    events.push(e);
    subscribers.forEach(cb => {
      try { cb(e); } catch {}
    });
  });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  saveToDisk();
}

function getAll() {
  return [...events];
}

function getById(id) {
  return events.find(e => e.id === id) || null;
}

function getRecent(n = 50) {
  return events.slice(-n).reverse();
}

function getBySource(source) {
  return events.filter(e => e.source === source);
}

function getRanked(n = 50) {
  // Return most recent events already scored and ranked
  return events
    .filter(e => typeof e.score === 'number')
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

function getStats() {
  const total = events.length;
  const critical = events.filter(e => e.priority === 'P1').length;
  const high = events.filter(e => e.priority === 'P2').length;
  const sources = [...new Set(events.map(e => e.source))];
  const avgScore = total
    ? (events.reduce((s, e) => s + (e.score || 0), 0) / total).toFixed(2)
    : 0;
  return { total, critical, high, sources, avgScore };
}

// ── SSE Subscriptions ─────────────────────────────────────────────────────────
function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

// Init
loadFromDisk();

module.exports = { add, addBatch, getAll, getById, getRecent, getBySource, getRanked, getStats, subscribe };
