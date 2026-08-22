// routes/config.js — Operator feedback loop: scoring weight management

const express = require('express');
const router = express.Router();
const scorer = require('../engine/scorer');
const auditLog = require('../store/auditLog');

// ── GET /api/config/weights ───────────────────────────────────────────────────
router.get('/weights', (req, res) => {
  res.json({
    weights: scorer.getWeights(),
    defaults: { severity: 0.35, impact: 0.30, recency: 0.20, frequency: 0.15 }
  });
});

// ── PUT /api/config/weights ───────────────────────────────────────────────────
// Operator feedback: adjust scoring weights live.
// Body: { severity: 0.4, impact: 0.3, recency: 0.2, frequency: 0.1 }
router.put('/weights', (req, res) => {
  const { severity, impact, recency, frequency } = req.body;

  // Validate all fields present
  if ([severity, impact, recency, frequency].some(v => typeof v !== 'number')) {
    return res.status(400).json({
      error: 'All four weights required: severity, impact, recency, frequency (numbers)'
    });
  }

  try {
    const updated = scorer.setWeights({ severity, impact, recency, frequency });
    auditLog.write({
      level: 'info',
      step: 'weight_update',
      message: 'Operator updated scoring weights',
      weights: updated
    });
    res.json({ message: 'Weights updated successfully', weights: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── POST /api/config/reset ────────────────────────────────────────────────────
router.post('/reset', (req, res) => {
  const weights = scorer.resetWeights();
  auditLog.write({ level: 'info', step: 'weight_reset', message: 'Weights reset to defaults', weights });
  res.json({ message: 'Weights reset to defaults', weights });
});

module.exports = router;
