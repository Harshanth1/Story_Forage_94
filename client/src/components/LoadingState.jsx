// components/LoadingState.jsx
import React from 'react';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div className="skeleton skel-line short" style={{ width: 36, height: 18 }} />
        <div className="skeleton skel-line" style={{ width: 80, height: 18 }} />
        <div className="skeleton skel-line" style={{ width: 60, height: 18, marginLeft: 'auto' }} />
      </div>
      <div className="skeleton skel-line long" />
      <div className="skeleton skel-line medium" style={{ marginTop: 4 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <div className="skeleton" style={{ flex: 1, height: 4 }} />
        <div className="skeleton" style={{ width: 36, height: 4 }} />
      </div>
    </div>
  );
}

export default function LoadingState() {
  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
