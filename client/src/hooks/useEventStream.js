// hooks/useEventStream.js — SSE connection with auto-reconnect
import { useState, useEffect, useRef, useCallback } from 'react';

const SSE_URL = '/api/events/stream';
const MAX_EVENTS = 200;

export function useEventStream() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, sources: [], avgScore: 0 });
  const [status, setStatus] = useState('connecting'); // connecting | connected | reconnecting | disconnected
  const [newEventCount, setNewEventCount] = useState(0);
  const esRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const isAtBottomRef = useRef(true);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    setStatus('connecting');
    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.addEventListener('snapshot', (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents(data.events || []);
        setStats(data.stats || {});
        setStatus('connected');
        reconnectAttempts.current = 0;
      } catch {}
    });

    es.addEventListener('event', (e) => {
      try {
        const event = JSON.parse(e.data);
        setEvents(prev => {
          const next = [event, ...prev].slice(0, MAX_EVENTS);
          return next;
        });
        if (!isAtBottomRef.current) {
          setNewEventCount(n => n + 1);
        }
      } catch {}
    });

    es.addEventListener('stats', (e) => {
      try {
        setStats(JSON.parse(e.data));
      } catch {}
    });

    es.onopen = () => {
      setStatus('connected');
      reconnectAttempts.current = 0;
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setStatus('reconnecting');

      // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 15000);
      reconnectAttempts.current++;

      reconnectTimer.current = setTimeout(() => {
        if (reconnectAttempts.current > 10) {
          setStatus('disconnected');
        } else {
          connect();
        }
      }, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const retry = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  const clearNewCount = useCallback(() => setNewEventCount(0), []);

  return { events, stats, status, newEventCount, clearNewCount, retry, isAtBottomRef };
}
