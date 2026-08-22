// components/EmptyState.jsx
import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="state-container">
      <div className="state-icon" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent-light)', animation: 'pulse-green 3s ease-in-out infinite' }}>
        <Inbox size={28} />
      </div>
      <div>
        <div className="state-title">Waiting for events…</div>
        <p className="state-desc" style={{ marginTop: 8 }}>
          The simulator is warming up. Events from <strong style={{ color: 'var(--infra-color)' }}>Infrastructure</strong>,{' '}
          <strong style={{ color: 'var(--product-color)' }}>Product</strong>, and{' '}
          <strong style={{ color: 'var(--user-color)' }}>User Behavior</strong> streams will appear here, ranked by AI-computed priority.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {['infrastructure', 'product', 'user-behavior'].map(src => (
          <span key={src} className={`source-badge ${src}`} style={{ fontSize: '0.7rem', padding: '4px 12px' }}>
            {src}
          </span>
        ))}
      </div>
    </div>
  );
}
