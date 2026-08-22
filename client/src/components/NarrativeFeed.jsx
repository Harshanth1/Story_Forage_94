// components/NarrativeFeed.jsx — Main ranked event feed
import React, { useState, useMemo } from 'react';
import { Activity, Server, Package, Users } from 'lucide-react';
import EmptyState from './EmptyState.jsx';
import LoadingState from './LoadingState.jsx';

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function getScoreColor(score) {
  if (score >= 0.8) return 'var(--p1)';
  if (score >= 0.6) return 'var(--p2)';
  if (score >= 0.35) return 'var(--p3)';
  return 'var(--p4)';
}

function SourceIcon({ source }) {
  const icons = {
    infrastructure: <Server size={12} />,
    product: <Package size={12} />,
    'user-behavior': <Users size={12} />
  };
  return icons[source] || <Activity size={12} />;
}

function EventCard({ event, isSelected, onClick }) {
  const scoreColor = getScoreColor(event.score || 0);
  const pClass = (event.priority || 'P4').toLowerCase();

  return (
    <div
      className={`event-card ${pClass} ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(event)}
    >
      <div className="event-card-top">
        <span className={`priority-badge ${event.priority || 'P4'}`}>
          {event.priority || 'P4'}
        </span>
        <span className={`source-badge ${event.source}`}>
          <SourceIcon source={event.source} />
          {event.source}
        </span>
        <span className="event-type">{event.type?.replace(/_/g, ' ')}</span>
        <span className="event-time">{timeAgo(event.timestamp)}</span>
      </div>

      <p className="event-narrative">
        {event.narrative || 'Processing event…'}
      </p>

      <div className="event-card-bottom">
        <div className="event-meta">
          <span className="meta-tag">{event.service}</span>
          <span className="meta-tag">{event.region}</span>
          {event.userImpact > 0 && (
            <span className="meta-tag">{event.userImpact?.toLocaleString()} users</span>
          )}
        </div>
        <div className="score-bar-container">
          <div
            className="score-bar-fill"
            style={{ width: `${(event.score || 0) * 100}%`, background: scoreColor }}
          />
        </div>
        <span className="score-value">{((event.score || 0) * 100).toFixed(0)}</span>
      </div>
    </div>
  );
}

const FILTERS = [
  { label: 'All', value: null },
  { label: '🔴 P1', value: 'P1' },
  { label: '🟠 P2', value: 'P2' },
  { label: '🟡 P3', value: 'P3' },
  { label: '🟢 P4', value: 'P4' },
];

const SOURCE_FILTERS = [
  { label: 'All Sources', value: null },
  { label: '⚙️ Infra', value: 'infrastructure' },
  { label: '📦 Product', value: 'product' },
  { label: '👤 Users', value: 'user-behavior' },
];

export default function NarrativeFeed({ events, status, selectedId, onSelect, onRetry }) {
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);

  const filtered = useMemo(() => {
    let ev = [...events];
    if (priorityFilter) ev = ev.filter(e => e.priority === priorityFilter);
    if (sourceFilter) ev = ev.filter(e => e.source === sourceFilter);
    return ev;
  }, [events, priorityFilter, sourceFilter]);

  const isLoading = status === 'connecting';
  const isEmpty = !isLoading && filtered.length === 0;

  return (
    <div className="glass-card feed-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Activity size={14} />
          Narrative Feed
          {filtered.length > 0 && (
            <span style={{ color: 'var(--accent-light)', fontWeight: 700, marginLeft: 4 }}>
              {filtered.length}
            </span>
          )}
        </div>
      </div>

      {/* Priority filters */}
      <div className="filter-bar" style={{ borderBottom: '1px solid var(--border)' }}>
        {FILTERS.map(f => (
          <button
            key={f.value ?? 'all'}
            className={`filter-btn ${priorityFilter === f.value ? 'active' : ''}`}
            onClick={() => setPriorityFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {SOURCE_FILTERS.map(f => (
          <button
            key={f.value ?? 'all-src'}
            className={`filter-btn ${sourceFilter === f.value ? 'active' : ''}`}
            onClick={() => setSourceFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="feed-list">
        {isLoading && <LoadingState />}
        {!isLoading && isEmpty && events.length === 0 && <EmptyState />}
        {!isLoading && isEmpty && events.length > 0 && (
          <div className="state-container">
            <div className="state-desc">No events match the current filters.</div>
          </div>
        )}
        {!isLoading && filtered.map(event => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={selectedId === event.id}
            onClick={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
