// engine/narrator.js — Template-based Natural Language Generation
// Produces human-readable explanations for ranked events.

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = {
  // Infrastructure
  cpu_spike: [
    'CPU utilization on {service} in {region} has breached {pct}%, affecting {users} users. Sustained load suggests potential saturation or runaway process.',
    '{service} is pegging CPU at {pct}% in {region}. If unresolved, this may cascade to dependent services within minutes.',
    'High CPU on {service} ({pct}%) detected in {region}. {users} users are experiencing degraded response times.'
  ],
  memory_pressure: [
    '{service} is running low on heap memory in {region} ({pct}% used). OOM kill risk if traffic continues.',
    'Memory alert on {service} in {region}: {pct}% consumed. Potential memory leak detected across {users} active sessions.',
    'Heap exhaustion imminent on {service} ({pct}% memory, {region}). Immediate attention required to prevent crash.'
  ],
  disk_warning: [
    'Disk usage on {service} in {region} has reached {pct}%. Log rotation or cleanup required to prevent write failures.',
    'Storage capacity warning: {service} ({region}) at {pct}% disk. Write-ahead logs may be at risk.',
    '{service} disk usage critical at {pct}% in {region}. Database writes may begin failing within 2–4 hours.'
  ],
  network_error: [
    'Network error rate spike on {service} in {region}: {rate}% packet loss detected, impacting {users} users.',
    '{service} is experiencing connectivity issues in {region}. {users} users seeing request timeouts.',
    'Elevated network errors on {service} ({region}): {rate}% of requests failing. Possible upstream routing issue.'
  ],
  latency_spike: [
    'Response latency on {service} has surged to {ms}ms in {region}, exceeding SLA threshold by {mult}×.',
    '{service} p99 latency spike in {region}: {ms}ms. {users} users experiencing slow page loads.',
    'Latency degradation detected on {service} ({region}): {ms}ms response time affecting {users} active users.'
  ],
  service_down: [
    '{service} is DOWN in {region}. All {users} active users are blocked. Immediate escalation required.',
    'CRITICAL: {service} health checks failing in {region}. {users} users completely unable to access the service.',
    'Service outage confirmed: {service} in {region} is unreachable. On-call team should be paged immediately.'
  ],

  // Product / Deploy
  deployment: [
    'New deployment of {service} v{version} is live in {region}. Monitor error rates and latency for regression.',
    '{service} v{version} deployed to {region}. Rollback available if metrics degrade in next 15 minutes.',
    'Deployment completed: {service} v{version} in {region}. {users} users are on the new version.'
  ],
  rollback: [
    'ROLLBACK triggered for {service} in {region}. Previous version being restored due to {reason}.',
    '{service} deployment rolled back in {region}. Engineers are investigating root cause of {reason}.',
    'Urgent rollback: {service} v{version} reverted in {region} after {reason} detected post-deploy.'
  ],
  config_change: [
    'Configuration change applied to {service} in {region}. Feature flag "{flag}" {state}.',
    '{service} config updated in {region}: {flag} is now {state}. Observe downstream behavior.',
    'Runtime config mutation on {service} ({region}): flag "{flag}" set to {state}.'
  ],
  feature_flag: [
    'Feature flag "{flag}" toggled {state} on {service} in {region}, affecting {pct}% of users.',
    '{service} feature "{flag}" is now {state} in {region}. {users} users are in the affected cohort.',
    'A/B test adjustment: {flag} is {state} on {service} ({region}) for {pct}% traffic.'
  ],

  // User Behavior
  error_rate_spike: [
    'User-facing error rate on {service} jumped to {pct}% in {region}. {users} users encountering failures.',
    '{service} client error rate spike in {region}: {pct}% of requests returning errors for {users} users.',
    'Error surge on {service} ({region}): {pct}% error rate. Likely correlated with recent deployment.'
  ],
  login_failure: [
    'Login failure rate on {service} is {pct}% in {region}. {users} users unable to authenticate.',
    'Authentication spike: {users} failed login attempts on {service} in {region}. Potential credential stuffing or outage.',
    '{service} showing elevated login failures ({pct}%) in {region}. Security and reliability investigation needed.'
  ],
  cart_abandonment: [
    'Cart abandonment rate on {service} spiked to {pct}% in {region}. Revenue impact estimate: ${revenue}/hr.',
    '{service} checkout flow abandonment surge in {region}: {pct}% drop-off. Possible payment gateway or UX issue.',
    'E-commerce signal: cart abandonment up {pct}% on {service} ({region}). ${revenue}/hr revenue at risk.'
  ],
  support_ticket_burst: [
    'Support ticket volume on {service} spiked {mult}× above baseline in {region}. Top issue: "{issue}".',
    '{users} new support tickets filed for {service} in {region} in the last 15 minutes. Common theme: "{issue}".',
    'Support escalation: {service} tickets surging in {region}. {users} affected users reporting "{issue}".'
  ],
  session_drop: [
    'Active session count on {service} dropped {pct}% in {region}. Possible crash or forced logouts affecting {users} users.',
    '{service} session collapse in {region}: {users} sessions terminated unexpectedly.',
    'Mass session drop on {service} ({region}): {pct}% of active users disconnected simultaneously.'
  ]
};

// ── Correlation note templates ─────────────────────────────────────────────────

const CORRELATION_NOTES = [
  'This correlates with {count} similar events from {source} in the last 15 minutes.',
  'Cluster of {count} related {source} events observed in the same window.',
  '{count} other {source} events share similar timing — possible common root cause.',
  'Part of a {count}-event cluster from {source}; consider reviewing together.'
];

// ── Urgency suffixes ───────────────────────────────────────────────────────────

const URGENCY_SUFFIX = {
  P1: ' ⚡ Immediate action required.',
  P2: ' 🔶 Prioritize for next 30 minutes.',
  P3: ' ℹ️ Monitor and address within the hour.',
  P4: ' ✅ Low urgency — address in normal workflow.'
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fmtNumber(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? val : `[${key}]`;
  });
}

// ── Main narrator function ────────────────────────────────────────────────────

/**
 * Generate a short natural-language explanation for a scored event.
 * @param {Object} event — scored event from scorer.js
 * @param {Object} [cluster] — optional correlation context { count, source }
 * @returns {string} human-readable narrative
 */
function narrate(event, cluster = null) {
  const meta = event.metadata || {};
  const templateSet = TEMPLATES[event.type];

  // Fallback for unknown event types
  if (!templateSet) {
    return fallbackNarrate(event);
  }

  const vars = {
    service:  event.service   || 'unknown-service',
    region:   event.region    || 'unknown-region',
    users:    fmtNumber(event.userImpact),
    pct:      meta.percent    || meta.cpu_percent || meta.error_rate || meta.abandonment_rate || meta.failure_rate || '??',
    rate:     meta.packet_loss_pct || meta.error_rate || '??',
    ms:       meta.latency_ms || meta.p99_ms || '??',
    mult:     meta.spike_multiplier || '??',
    version:  meta.version    || '?.?',
    reason:   meta.reason     || 'detected anomaly',
    flag:     meta.flag_name  || meta.flag  || 'unknown-flag',
    state:    meta.flag_state !== undefined ? (meta.flag_state ? 'enabled' : 'disabled') : (meta.state || '??'),
    revenue:  meta.revenue_impact ? Math.round(meta.revenue_impact).toLocaleString() : '??',
    issue:    meta.top_issue  || 'service degradation',
    count:    cluster ? cluster.count : 1
  };

  let narrative = fill(pick(templateSet), vars);

  // Append correlation note if cluster present
  if (cluster && cluster.count > 1) {
    const corrNote = fill(pick(CORRELATION_NOTES), {
      count: cluster.count,
      source: event.source
    });
    narrative += ' ' + corrNote;
  }

  // Append urgency suffix
  narrative += URGENCY_SUFFIX[event.priority] || '';

  return narrative;
}

/**
 * Generic fallback for unknown event types.
 */
function fallbackNarrate(event) {
  const users = fmtNumber(event.userImpact);
  const suffix = URGENCY_SUFFIX[event.priority] || '';
  return `${event.source} event "${event.type}" detected on ${event.service || 'unknown'} in ${event.region || 'unknown'}, affecting ${users} users.${suffix}`;
}

/**
 * Generate narratives for a batch of scored events.
 * Uses frequency cluster context automatically.
 */
function narrateBatch(scoredEvents) {
  // Build cluster map: group by source+type
  const clusters = {};
  for (const e of scoredEvents) {
    const key = `${e.source}:${e.type}`;
    clusters[key] = (clusters[key] || 0) + 1;
  }

  return scoredEvents.map(event => {
    const key = `${event.source}:${event.type}`;
    const count = clusters[key];
    const cluster = count > 1 ? { count, source: event.source } : null;
    return {
      ...event,
      narrative: narrate(event, cluster)
    };
  });
}

module.exports = { narrate, narrateBatch, fallbackNarrate };
