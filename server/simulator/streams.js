// simulator/streams.js — Three simulated JSON event stream generators
// Produces realistic infrastructure, product/deploy, and user-behavior events.

const { v4: uuidv4 } = require('uuid');

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];
const INFRA_SERVICES = ['auth-service', 'api-gateway', 'payment-service', 'cache-layer', 'db-primary', 'search-service', 'cdn-edge', 'worker-queue'];
const PRODUCT_SERVICES = ['web-app', 'mobile-api', 'admin-portal', 'notification-service', 'analytics-pipeline', 'billing-service'];
const USER_SERVICES = ['checkout-flow', 'user-portal', 'onboarding', 'search-ui', 'dashboard', 'support-portal'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }
function randBool(p = 0.5) { return Math.random() < p; }

function baseEvent(source) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    source
  };
}

// ── Stream 1: Infrastructure Events ──────────────────────────────────────────

const INFRA_EVENTS = [
  () => ({
    ...baseEvent('infrastructure'),
    type: 'cpu_spike',
    service: pick(INFRA_SERVICES),
    region: pick(REGIONS),
    severity: rand(3, 5),
    userImpact: rand(1000, 50000),
    metadata: { cpu_percent: rand(80, 99), duration_seconds: rand(30, 300) }
  }),
  () => ({
    ...baseEvent('infrastructure'),
    type: 'memory_pressure',
    service: pick(INFRA_SERVICES),
    region: pick(REGIONS),
    severity: rand(2, 5),
    userImpact: rand(500, 30000),
    metadata: { percent: rand(75, 98), heap_used_gb: randFloat(8, 32) }
  }),
  () => ({
    ...baseEvent('infrastructure'),
    type: 'latency_spike',
    service: pick(INFRA_SERVICES),
    region: pick(REGIONS),
    severity: rand(2, 5),
    userImpact: rand(2000, 80000),
    metadata: { latency_ms: rand(500, 8000), p99_ms: rand(1000, 15000), spike_multiplier: rand(3, 20) }
  }),
  () => ({
    ...baseEvent('infrastructure'),
    type: 'network_error',
    service: pick(INFRA_SERVICES),
    region: pick(REGIONS),
    severity: rand(2, 4),
    userImpact: rand(100, 20000),
    metadata: { packet_loss_pct: randFloat(1, 30), error_rate: randFloat(5, 40) }
  }),
  () => ({
    ...baseEvent('infrastructure'),
    type: 'disk_warning',
    service: pick(['db-primary', 'cache-layer', 'worker-queue']),
    region: pick(REGIONS),
    severity: rand(2, 4),
    userImpact: rand(0, 5000),
    metadata: { percent: rand(78, 97), free_gb: randFloat(2, 50) }
  }),
  () => ({
    ...baseEvent('infrastructure'),
    type: 'service_down',
    service: pick(INFRA_SERVICES),
    region: pick(REGIONS),
    severity: 5,
    userImpact: rand(5000, 100000),
    metadata: { last_healthy: new Date(Date.now() - rand(60, 600) * 1000).toISOString(), health_check_failures: rand(3, 20) }
  })
];

// ── Stream 2: Product / Deploy Events ────────────────────────────────────────

const PRODUCT_EVENTS = [
  () => ({
    ...baseEvent('product'),
    type: 'deployment',
    service: pick(PRODUCT_SERVICES),
    region: pick(REGIONS),
    severity: rand(1, 2),
    userImpact: rand(500, 20000),
    metadata: { version: `${rand(1, 9)}.${rand(0, 99)}.${rand(0, 99)}`, commit: uuidv4().slice(0, 8), deployer: pick(['ci-robot', 'alice', 'bob', 'charlie']) }
  }),
  () => ({
    ...baseEvent('product'),
    type: 'rollback',
    service: pick(PRODUCT_SERVICES),
    region: pick(REGIONS),
    severity: rand(3, 5),
    userImpact: rand(2000, 40000),
    metadata: {
      version: `${rand(1, 9)}.${rand(0, 99)}.${rand(0, 99)}`,
      reason: pick(['error_rate_spike', 'latency_regression', 'memory_leak', 'critical_bug', 'failed_health_check'])
    }
  }),
  () => ({
    ...baseEvent('product'),
    type: 'feature_flag',
    service: pick(PRODUCT_SERVICES),
    region: pick(REGIONS),
    severity: rand(1, 3),
    userImpact: rand(100, 50000),
    metadata: {
      flag_name: pick(['new-checkout-v2', 'ai-recommendations', 'dark-mode', 'beta-dashboard', 'payment-v3', 'onboarding-flow-b']),
      flag_state: randBool(),
      percent: rand(1, 100)
    }
  }),
  () => ({
    ...baseEvent('product'),
    type: 'config_change',
    service: pick(PRODUCT_SERVICES),
    region: pick(REGIONS),
    severity: rand(1, 3),
    userImpact: rand(0, 10000),
    metadata: {
      flag: pick(['rate-limit', 'cache-ttl', 'max-connections', 'timeout-ms', 'retry-policy']),
      state: pick(['updated', 'enabled', 'disabled', 'increased', 'decreased'])
    }
  })
];

// ── Stream 3: User Behavior Events ───────────────────────────────────────────

const USER_EVENTS = [
  () => ({
    ...baseEvent('user-behavior'),
    type: 'error_rate_spike',
    service: pick(USER_SERVICES),
    region: pick(REGIONS),
    severity: rand(3, 5),
    userImpact: rand(1000, 60000),
    metadata: { error_rate: randFloat(5, 40), prev_error_rate: randFloat(0.5, 2) }
  }),
  () => ({
    ...baseEvent('user-behavior'),
    type: 'login_failure',
    service: pick(['user-portal', 'onboarding', 'admin-portal']),
    region: pick(REGIONS),
    severity: rand(3, 5),
    userImpact: rand(500, 25000),
    metadata: { failure_rate: randFloat(10, 60), attempts: rand(100, 10000) }
  }),
  () => ({
    ...baseEvent('user-behavior'),
    type: 'cart_abandonment',
    service: 'checkout-flow',
    region: pick(REGIONS),
    severity: rand(2, 4),
    userImpact: rand(200, 15000),
    metadata: {
      abandonment_rate: randFloat(30, 80),
      revenue_impact: randFloat(1000, 50000)
    }
  }),
  () => ({
    ...baseEvent('user-behavior'),
    type: 'support_ticket_burst',
    service: pick(USER_SERVICES),
    region: pick(REGIONS),
    severity: rand(2, 4),
    userImpact: rand(100, 8000),
    metadata: {
      spike_multiplier: rand(3, 15),
      top_issue: pick(['cannot-login', 'payment-failing', 'slow-loading', 'missing-data', 'export-broken', 'notification-not-sent'])
    }
  }),
  () => ({
    ...baseEvent('user-behavior'),
    type: 'session_drop',
    service: pick(USER_SERVICES),
    region: pick(REGIONS),
    severity: rand(3, 5),
    userImpact: rand(1000, 50000),
    metadata: { percent: randFloat(20, 90), drop_count: rand(1000, 50000) }
  })
];

// ── Simulator orchestrator ────────────────────────────────────────────────────

let simulatorActive = false;
const timers = [];

function generateInfraEvent()   { return pick(INFRA_EVENTS)(); }
function generateProductEvent() { return pick(PRODUCT_EVENTS)(); }
function generateUserEvent()    { return pick(USER_EVENTS)(); }

function generateBurst(count = 5) {
  const batch = [];
  for (let i = 0; i < count; i++) {
    const gen = pick([generateInfraEvent, generateProductEvent, generateUserEvent]);
    batch.push(gen());
  }
  return batch;
}

function startSimulator() {
  if (simulatorActive) return;
  simulatorActive = true;

  const PORT = process.env.PORT || 3001;
  const INGEST_URL = `http://localhost:${PORT}/api/events/ingest`;

  console.log('[Simulator] Starting 3 event streams...');
  console.log(`[Simulator] All streams will POST to ${INGEST_URL}`);

  /**
   * Post a batch of raw events to the HTTP ingest endpoint.
   * This ensures all three source streams travel the full validated
   * scoring → correlation → narrative → SSE path, just like external callers.
   */
  async function postToIngest(streamName, events) {
    try {
      const res = await fetch(INGEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Simulator-Stream': streamName },
        body: JSON.stringify(events)
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`[Simulator:${streamName}] Ingest returned ${res.status}: ${text}`);
      }
    } catch (err) {
      console.warn(`[Simulator:${streamName}] POST failed: ${err.message}`);
    }
  }

  // Stream 1: Infrastructure — every 4–8s
  function scheduleInfra() {
    const delay = rand(4000, 8000);
    const t = setTimeout(async () => {
      if (!simulatorActive) return;
      const events = [generateInfraEvent()];
      // Occasionally emit a correlated cluster (two related infra events)
      if (randBool(0.3)) events.push(generateInfraEvent());
      await postToIngest('infrastructure', events);
      scheduleInfra();
    }, delay);
    timers.push(t);
  }

  // Stream 2: Product/Deploy — every 12–20s
  function scheduleProduct() {
    const delay = rand(12000, 20000);
    const t = setTimeout(async () => {
      if (!simulatorActive) return;
      await postToIngest('product', [generateProductEvent()]);
      scheduleProduct();
    }, delay);
    timers.push(t);
  }

  // Stream 3: User Behavior — every 5–12s
  function scheduleUser() {
    const delay = rand(5000, 12000);
    const t = setTimeout(async () => {
      if (!simulatorActive) return;
      const events = [generateUserEvent()];
      if (randBool(0.25)) events.push(generateUserEvent());
      await postToIngest('user-behavior', events);
      scheduleUser();
    }, delay);
    timers.push(t);
  }

  // Initial burst: wait 500ms for the server to fully bind, then POST across all 3 streams
  setTimeout(async () => {
    const burstInfra   = [generateInfraEvent(), generateInfraEvent()];
    const burstProduct = [generateProductEvent()];
    const burstUser    = [generateUserEvent(), generateUserEvent()];

    await Promise.all([
      postToIngest('infrastructure', burstInfra),
      postToIngest('product',        burstProduct),
      postToIngest('user-behavior',  burstUser)
    ]);

    console.log('[Simulator] Initial burst: 5 events POSTed via HTTP across all 3 streams.');

    scheduleInfra();
    scheduleProduct();
    scheduleUser();

    console.log('[Simulator] All 3 streams active and posting over HTTP.');
  }, 500);
}

function stopSimulator() {
  simulatorActive = false;
  timers.forEach(clearTimeout);
  timers.length = 0;
  console.log('[Simulator] Stopped.');
}

module.exports = {
  startSimulator,
  stopSimulator,
  generateBurst,
  generateInfraEvent,
  generateProductEvent,
  generateUserEvent
};
