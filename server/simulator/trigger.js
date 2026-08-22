// simulator/trigger.js — Manual burst trigger for `npm run simulate`
// POSTs a burst of events from all 3 streams to the running server.

const PORT = process.env.PORT || 3001;
const INGEST_URL = `http://localhost:${PORT}/api/events/ingest`;
const BURST_SIZE = parseInt(process.argv[2]) || 10; // default 10, override: node trigger.js 20

const {
  generateInfraEvent,
  generateProductEvent,
  generateUserEvent
} = require('./streams');

const STREAMS = [
  { name: 'infrastructure', gen: generateInfraEvent },
  { name: 'product',        gen: generateProductEvent },
  { name: 'user-behavior',  gen: generateUserEvent }
];

async function triggerBurst() {
  console.log(`\n🔥 StoryForge 94 — Manual Burst Trigger`);
  console.log(`   Target : ${INGEST_URL}`);
  console.log(`   Events : ${BURST_SIZE} (${Math.ceil(BURST_SIZE / 3)} per stream)\n`);

  const results = await Promise.all(
    STREAMS.map(async ({ name, gen }) => {
      const count = Math.ceil(BURST_SIZE / 3);
      const events = Array.from({ length: count }, () => gen());

      try {
        const res = await fetch(INGEST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Simulator-Stream': name },
          body: JSON.stringify(events)
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(`  ✗ [${name}] HTTP ${res.status}: ${text}`);
          return { name, ok: false };
        }

        const data = await res.json();
        const p1 = data.events.filter(e => e.priority === 'P1').length;
        const p2 = data.events.filter(e => e.priority === 'P2').length;
        console.log(`  ✓ [${name}] ${data.ingested} events → P1:${p1} P2:${p2} (${data.elapsed_ms}ms)`);
        return { name, ok: true, ingested: data.ingested };
      } catch (err) {
        console.error(`  ✗ [${name}] Connection failed: ${err.message}`);
        console.error(`    Is the server running on port ${PORT}?`);
        return { name, ok: false };
      }
    })
  );

  const total = results.reduce((s, r) => s + (r.ingested || 0), 0);
  const failed = results.filter(r => !r.ok).length;

  console.log(`\n${failed === 0 ? '✅' : '⚠️'}  Done — ${total} events ingested across 3 streams.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

triggerBurst();
