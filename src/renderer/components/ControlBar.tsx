import React, { useState } from 'react';

interface ControlBarProps {
  autoScrollActive: boolean;
  onToggleAutoScroll: () => void;
  onAddScreen: () => void;
  onAddBatch: () => void;
  screenCount: number;
  globalUrl: string;
  onGlobalUrlChange: (url: string) => void;
}

export default function ControlBar({
  autoScrollActive,
  onToggleAutoScroll,
  onAddScreen,
  onAddBatch,
  screenCount,
  globalUrl,
  onGlobalUrlChange,
}: ControlBarProps) {
  return (
    <div className="control-bar">
      <div className="control-bar-left">
        <button className="btn-primary" onClick={onAddScreen}>
          <span className="btn-icon-text">+</span> Add Screen
        </button>
        <button className="btn-secondary" onClick={onAddBatch}>
          <span className="btn-icon-text">⚡</span> Quick Add 3
        </button>

        <div className="separator" />

        <div className="url-input-group">
          <label htmlFor="global-url">Default URL:</label>
          <input
            id="global-url"
            type="url"
            className="url-input"
            value={globalUrl}
            onChange={(e) => onGlobalUrlChange(e.target.value)}
            placeholder="https://www.instagram.com/reels/"
          />
        </div>
      </div>

      <div className="control-bar-right">
        <div className="screen-counter">
          <span className="counter-label">Screens:</span>
          <span className="counter-value">{screenCount}</span>
        </div>

        <button
          className={`btn-scroll-toggle ${autoScrollActive ? 'active' : ''}`}
          onClick={onToggleAutoScroll}
          title={autoScrollActive ? 'Stop Auto Scroll' : 'Start Auto Scroll'}
        >
          <span className="scroll-icon">{autoScrollActive ? '⏸' : '▶'}</span>
          <span className="scroll-label">
            Auto Scroll: {autoScrollActive ? 'ON' : 'OFF'}
          </span>
          {autoScrollActive && <span className="pulse-dot" />}
        </button>
      </div>
    </div>
  );
}
