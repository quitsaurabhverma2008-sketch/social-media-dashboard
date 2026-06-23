import React from 'react';

export default function TitleBar() {
  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <span className="title-bar-logo">⬡</span>
        <span className="title-bar-title">Social Media Dashboard</span>
      </div>
      <div className="title-bar-controls">
        <button
          className="title-btn minimize"
          onClick={() => window.electronAPI?.minimize()}
          title="Minimize"
        >
          ─
        </button>
        <button
          className="title-btn maximize"
          onClick={() => window.electronAPI?.maximize()}
          title="Maximize"
        >
          □
        </button>
        <button
          className="title-btn close"
          onClick={() => window.electronAPI?.close()}
          title="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
