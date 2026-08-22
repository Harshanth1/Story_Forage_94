// components/WeightAdjuster.jsx — Operator feedback loop for scoring weights
import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, Check } from 'lucide-react';
import { useWeights } from '../hooks/useWeights.js';

const WEIGHT_KEYS = [
  { key: 'severity', label: 'Severity', color: 'var(--p1)', tip: 'How severe is the technical issue?' },
  { key: 'impact', label: 'User Impact', color: 'var(--p2)', tip: 'How many users are affected?' },
  { key: 'recency', label: 'Recency', color: 'var(--accent)', tip: 'How recent is the event?' },
  { key: 'frequency', label: 'Frequency', color: 'var(--product-color)', tip: 'How often is this type occurring?' },
];

export default function WeightAdjuster() {
  const { weights, saving, error, saveSuccess, updateWeights, resetWeights } = useWeights();
  const [local, setLocal] = useState(weights);

  // Sync when server weights change
  useEffect(() => { setLocal(weights); }, [weights]);

  const total = Object.values(local).reduce((s, v) => s + v, 0);
  const sumOk = Math.abs(total - 1.0) < 0.01;

  function handleSlider(key, val) {
    const value = parseFloat(val);
    setLocal(prev => {
      const next = { ...prev, [key]: value };
      // Auto-adjust others to keep sum = 1
      const others = WEIGHT_KEYS.map(k => k.key).filter(k => k !== key);
      const remaining = parseFloat((1 - value).toFixed(4));
      const currentOthersSum = others.reduce((s, k) => s + next[k], 0);
      if (currentOthersSum > 0) {
        const ratio = remaining / currentOthersSum;
        others.forEach(k => { next[k] = parseFloat((next[k] * ratio).toFixed(4)); });
      }
      return next;
    });
  }

  function handleApply() {
    if (!sumOk) return;
    updateWeights(local);
  }

  return (
    <div className="glass-card weight-adjuster">
      <div className="panel-header">
        <div className="panel-title"><Sliders size={14} /> Ranking Weights</div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Feedback Loop</span>
      </div>

      <div className="weight-content">
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Adjust how the AI ranks events. Changes apply to the live feed immediately.
        </p>

        {WEIGHT_KEYS.map(({ key, label, color, tip }) => (
          <div className="weight-row" key={key}>
            <div className="weight-label-row">
              <span className="weight-label" title={tip}>{label}</span>
              <span className="weight-pct" style={{ color }}>{Math.round(local[key] * 100)}%</span>
            </div>
            <input
              type="range"
              className="weight-slider"
              min="0.05"
              max="0.70"
              step="0.01"
              value={local[key]}
              onChange={e => handleSlider(key, e.target.value)}
              style={{ accentColor: color }}
            />
          </div>
        ))}

        {/* Sum indicator */}
        <div className={sumOk ? 'weight-sum-ok' : 'weight-warning'}>
          {sumOk
            ? <><Check size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Weights balanced (100%)</>
            : `⚠ Total: ${Math.round(total * 100)}% (must equal 100%)`
          }
        </div>

        {error && (
          <div className="weight-warning">{error}</div>
        )}

        {saveSuccess && (
          <div className="success-msg">✓ Weights applied — feed re-ranking</div>
        )}

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!sumOk || saving}
          >
            {saving ? 'Applying…' : 'Apply Weights'}
          </button>
          <button className="btn btn-ghost" onClick={resetWeights} disabled={saving}>
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
