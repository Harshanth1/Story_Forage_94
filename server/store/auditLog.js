// store/auditLog.js — Append-only structured audit log
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../data/audit.jsonl');

function write(entry) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...entry
  }) + '\n';
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    console.error('[AuditLog] Write failed:', e.message);
  }
}

function readAll() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    return content
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readForEvent(eventId) {
  return readAll().filter(e => e.eventId === eventId);
}

module.exports = { write, readAll, readForEvent };
