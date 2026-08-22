// components/StatsBar.jsx
import React from 'react';
import { AlertTriangle, TrendingUp, Users, Database, Percent } from 'lucide-react';

export default function StatsBar({ stats }) {
  const { total = 0, critical = 0, high = 0, sources = [], avgScore = 0 } = stats;
  const noiseReduction = total > 0 ? Math.round((1 - critical / total) * 100) : 0;

  const items = [
    {
      icon: <Database size={18} />,
      iconStyle: { background: 'rgba(99,102,241,0.15)', color: 'var(--accent-light)' },
      value: total.toLocaleString(),
      label: 'Total Events',
      valueStyle: {}
    },
    {
      icon: <AlertTriangle size={18} />,
      iconStyle: { background: 'rgba(239,68,68,0.15)', color: 'var(--p1)' },
      value: critical,
      label: 'Critical (P1)',
      valueStyle: { color: 'var(--p1)' }
    },
    {
      icon: <TrendingUp size={18} />,
      iconStyle: { background: 'rgba(249,115,22,0.15)', color: 'var(--p2)' },
      value: high,
      label: 'High (P2)',
      valueStyle: { color: 'var(--p2)' }
    },
    {
      icon: <Users size={18} />,
      iconStyle: { background: 'rgba(6,182,212,0.15)', color: 'var(--infra-color)' },
      value: sources.length,
      label: 'Active Sources',
      valueStyle: {}
    },
    {
      icon: <Percent size={18} />,
      iconStyle: { background: 'rgba(34,197,94,0.15)', color: 'var(--p4)' },
      value: `${noiseReduction}%`,
      label: 'Noise Filtered',
      valueStyle: { color: 'var(--p4)' }
    }
  ];

  return (
    <div className="stats-bar">
      {items.map((item, i) => (
        <div className="stat-card" key={i}>
          <div className="stat-icon" style={item.iconStyle}>
            {item.icon}
          </div>
          <div className="stat-info">
            <div className="stat-value" style={item.valueStyle}>{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
