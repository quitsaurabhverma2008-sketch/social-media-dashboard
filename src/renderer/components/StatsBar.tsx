import React, { useEffect, useState } from 'react';

export interface ScreenStats {
  scrollCount: number;
  lastScrollTime: number | null;
  uptime: number; // seconds since screen was added
  addedAt: number;
}

interface StatsBarProps {
  screenCount: number;
  totalScrolls: number;
  autoScrollActive: boolean;
  screens: ScreenStats[];
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function StatsBar({ screenCount, totalScrolls, autoScrollActive, screens }: StatsBarProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const avgScrolls = screenCount > 0 ? Math.round(totalScrolls / screenCount) : 0;
  const totalUptime = screens.reduce((sum, s) => sum + (Date.now() - s.addedAt) / 1000, 0);

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-icon">📊</span>
        <div className="stat-content">
          <span className="stat-value">{totalScrolls}</span>
          <span className="stat-label">Total Scrolls</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className="stat-icon">📱</span>
        <div className="stat-content">
          <span className="stat-value">{screenCount}</span>
          <span className="stat-label">Active Screens</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className="stat-icon">🔄</span>
        <div className="stat-content">
          <span className="stat-value">{avgScrolls}</span>
          <span className="stat-label">Avg per Screen</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className="stat-icon">⏱️</span>
        <div className="stat-content">
          <span className="stat-value">{formatUptime(Math.floor(totalUptime))}</span>
          <span className="stat-label">Total Uptime</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className="stat-icon">{autoScrollActive ? '🟢' : '🔴'}</span>
        <div className="stat-content">
          <span className="stat-value">{autoScrollActive ? 'ACTIVE' : 'IDLE'}</span>
          <span className="stat-label">Engine Status</span>
        </div>
      </div>
    </div>
  );
}
