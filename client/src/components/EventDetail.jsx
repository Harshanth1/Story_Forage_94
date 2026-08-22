// components/EventDetail.jsx — Slide-out detail panel for selected event
import React, { useEffect, useState } from 'react';
import { FileText, X, Clock, BarChart2 } from 'lucide-react';

function ScoreBar({ label, value, max = 0.5 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>{(value * 100).toFixed(1)}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function EventDetail({ event, onClose }) {
  const [auditTrail, setAuditTrail] = useState([]);

  useEffect(() => {
    if (!event) return;
    setAuditTrail([]);
    // Fetch audit trail for this specific event
    fetch(`/api/events/${event.id}`)
      .then(r => r.json())
      .then(data => setAuditTrail(data.auditTrail || []))
      .catch(() => { });
  }, [event?.id]);

  if (!event) {
    return (
      <div className="glass-card detail-panel">
        <div className="panel-header">
          <div className="panel-title"><FileText size={14} /> Event Detail</div>
        </div>
        <div className="state-container" style={{ minHeight: 200 }}>
          <div className="state-desc">Select an event from the feed to see details</div>
        </div>
      </div>
    );
  }

  const breakdown = event.scoreBreakdown || {};
  const metaEntries = Object.entries(event.metadata || {}).slice(0, 8);

  return (
    <div className="glass-card detail-panel">
      <div className="panel-header">
        <div className="panel-title"><FileText size={14} /> Event Detail</div>
        <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 8px', minWidth: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div className="detail-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
        {/* Priority + badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span className={`priority-badge ${event.priority}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
            {event.priority}
          </span>
          <span className={`source-badge ${event.source}`}>
            {event.source}
          </span>
          <span className="meta-tag">{event.type?.replace(/_/g, ' ')}</span>
        </div>

        {/* Narrative */}
        <div className="detail-narrative">
          {event.narrative || 'No narrative generated.'}
        </div>

        {/* Score breakdown */}
        <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={11} /> Score Breakdown
          <span className="font-mono text-accent" style={{ fontSize: '0.75rem', marginLeft: 'auto' }}>
            Total: {((event.score || 0) * 100).toFixed(1)}
          </span>
        </div>
        <div style={{ marginBottom: 16 }}>
          {Object.entries(breakdown).map(([key, val]) => (
            <ScoreBar key={key} label={key} value={val} />
          ))}
        </div>

        {/* Metadata */}
        <div className="detail-section-title">Metadata</div>
        <div className="score-breakdown" style={{ marginBottom: 16 }}>
          <div className="breakdown-item">
            <div className="breakdown-label">Service</div>
            <div className="breakdown-value" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{event.service}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">Region</div>
            <div className="breakdown-value" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{event.region}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">Severity</div>
            <div className="breakdown-value">{event.severity}/5</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">User Impact</div>
            <div className="breakdown-value">{event.userImpact?.toLocaleString()}</div>
          </div>
        </div>

        {/* Extra metadata */}
        {metaEntries.length > 0 && (
          <>
            <div className="detail-section-title">Raw Metadata</div>
            <div className="json-viewer" style={{ marginBottom: 16 }}>
              {JSON.stringify(event.metadata, null, 2)}
            </div>
          </>
        )}

        {/* Audit trail */}
        <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={11} /> Audit Trail
        </div>
        <div className="audit-trail">
          {auditTrail.length === 0 ? (
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>No audit steps found.</div>
          ) : (
            auditTrail.map((step, i) => (
              <div key={i} className="audit-step">
                <div className="audit-dot" />
                <div>
                  <div className="audit-text">{step.step || step.message}</div>
                  <div className="audit-ts">{new Date(step.ts).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Full event ID */}
        <div className="detail-section-title">Event ID</div>
        <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
          {event.id}
        </div>
      </div>
    </div>
  );
}
