// hooks/useWeights.js — Fetch and update scoring weights
import { useState, useEffect, useCallback } from 'react';

const DEFAULT_WEIGHTS = { severity: 0.35, impact: 0.30, recency: 0.20, frequency: 0.15 };

export function useWeights() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchWeights = useCallback(async () => {
    try {
      const r = await fetch('/api/config/weights');
      if (!r.ok) throw new Error('Failed to fetch weights');
      const data = await r.json();
      setWeights(data.weights);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeights(); }, [fetchWeights]);

  const updateWeights = useCallback(async (newWeights) => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/config/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWeights)
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || 'Failed to update weights');
      }
      const data = await r.json();
      setWeights(data.weights);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  const resetWeights = useCallback(async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/config/reset', { method: 'POST' });
      const data = await r.json();
      setWeights(data.weights);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  return { weights, loading, saving, error, saveSuccess, updateWeights, resetWeights };
}
