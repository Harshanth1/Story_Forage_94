// engine/scorer.js — Weighted multi-dimensional scoring engine
//
// Score = (severity × W_sev) + (userImpact × W_imp) + (recency × W_rec) + (frequency × W_freq)
// All dimensions normalized to 0–1 scale before weighting.

// Default weights (mutable by operator feedback loop)
let weights = {
  severity: 0.35,
  impact:   0.30,
  recency:  0.20,
  frequency: 0.15
};

// Priority thresholds
const PRIORITY_MAP = [
  { min: 0.80, label: 'P1', color: '#ef4444' },
  { min: 0.60, label: 'P2', color: '#f97316' },
  { min: 0.35, label: 'P3', color: '#eab308' },
  { min: 0.00, label: 'P4', color: '#22c55e' }
];

/**
 * Normalize severity (1–5 scale) to 0–1
 */
function normSeverity(sev) {
  return Math.min(Math.max((sev - 1) / 4, 0), 1);
}

/**
 * Normalize user impact (0–100000 users) to 0–1 with log scale
 */
function normImpact(users) {
  if (!users || users <= 0) return 0;
  return Math.min(Math.log10(users + 1) / 5, 1);
}

/**
 * Normalize recency: events in last 5 min score highest
 */
function normRecency(timestamp) {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageMin = ageMs / 60000;
  // Decay: 1.0 at 0 min, ~0.1 at 30 min
  return Math.max(1 - ageMin / 30, 0.1);
}

/**
 * Normalize frequency: how many similar events in last window
 * Passed in as a pre-computed count (0–20)
 */
function normFrequency(count) {
  return Math.min(count / 20, 1);
}

/**
 * Score a single event object.
 * Returns the same event object, augmented with score/priority/breakdown.
 */
function score(event, frequencyCount = 0) {
  const s = normSeverity(event.severity || 1);
  const i = normImpact(event.userImpact || 0);
  const r = normRecency(event.timestamp || new Date().toISOString());
  const f = normFrequency(frequencyCount);

  const total =
    s * weights.severity +
    i * weights.impact +
    r * weights.recency +
    f * weights.frequency;

  const priority = PRIORITY_MAP.find(p => total >= p.min) || PRIORITY_MAP[PRIORITY_MAP.length - 1];

  return {
    ...event,
    score: parseFloat(total.toFixed(4)),
    priority: priority.label,
    priorityColor: priority.color,
    scoreBreakdown: {
      severity: parseFloat((s * weights.severity).toFixed(4)),
      impact:   parseFloat((i * weights.impact).toFixed(4)),
      recency:  parseFloat((r * weights.recency).toFixed(4)),
      frequency: parseFloat((f * weights.frequency).toFixed(4))
    }
  };
}

/**
 * Score and rank a batch of events.
 * Groups by (source+type) to compute frequency counts.
 */
function scoreAndRank(eventBatch) {
  // Frequency counting: events with same source+type in the batch
  const freqMap = {};
  for (const e of eventBatch) {
    const key = `${e.source}:${e.type}`;
    freqMap[key] = (freqMap[key] || 0) + 1;
  }

  return eventBatch
    .map(e => score(e, freqMap[`${e.source}:${e.type}`] || 0))
    .sort((a, b) => b.score - a.score);
}

// Weight management
function getWeights() {
  return { ...weights };
}

function setWeights(newWeights) {
  const { severity, impact, recency, frequency } = newWeights;
  const sum = (severity || 0) + (impact || 0) + (recency || 0) + (frequency || 0);
  if (Math.abs(sum - 1.0) > 0.01) {
    throw new Error(`Weights must sum to 1.0 (got ${sum.toFixed(2)})`);
  }
  weights = {
    severity: parseFloat(severity.toFixed(4)),
    impact:   parseFloat(impact.toFixed(4)),
    recency:  parseFloat(recency.toFixed(4)),
    frequency: parseFloat(frequency.toFixed(4))
  };
  return weights;
}

function resetWeights() {
  weights = { severity: 0.35, impact: 0.30, recency: 0.20, frequency: 0.15 };
  return weights;
}

module.exports = { score, scoreAndRank, getWeights, setWeights, resetWeights };
