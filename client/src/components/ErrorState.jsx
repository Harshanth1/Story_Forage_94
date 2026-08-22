// components/ErrorState.jsx
import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state-container">
      <div className="state-icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--p1)' }}>
        <AlertOctagon size={28} />
      </div>
      <div>
        <div className="state-title">Connection Lost</div>
        <p className="state-desc" style={{ marginTop: 8 }}>
          {message || 'Unable to connect to the event stream. Check that the server is running on port 3001.'}
        </p>
      </div>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 160, marginTop: 8 }}>
          <RefreshCw size={13} /> Retry Connection
        </button>
      )}
    </div>
  );
}
