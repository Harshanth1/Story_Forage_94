// components/Header.jsx
import React from 'react';
import { Zap, Radio } from 'lucide-react';

export default function Header({ status, totalCount }) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">
          <Zap size={18} color="white" />
        </div>
        <div>
          <div className="header-title">StoryForge 94</div>
          <div className="header-subtitle">Narrative Studio</div>
        </div>
      </div>

      <div className="header-right">
        <div className="event-counter">
          <strong>{totalCount.toLocaleString()}</strong> events triaged
        </div>
        <ConnectionStatus status={status} />
      </div>
    </header>
  );
}

function ConnectionStatus({ status }) {
  const labels = {
    connecting:    'Connecting…',
    connected:     'Live',
    reconnecting:  'Reconnecting…',
    disconnected:  'Offline'
  };
  return (
    <div className={`conn-status conn-status--${status === 'connected' ? 'connected' : status === 'disconnected' ? 'disconnected' : 'reconnecting'}`}>
      <div className="conn-dot" />
      <Radio size={11} />
      {labels[status] || status}
    </div>
  );
}
