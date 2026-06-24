import React, { useState, useCallback } from 'react';
import WebScreenCard from './WebScreenCard';

export interface Screen {
  id: number;
  name: string;
  url: string;
}

let screenIdCounter = 0;

export default function WebApp() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [globalUrl, setGlobalUrl] = useState('https://www.instagram.com/reels/');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalUrl, setModalUrl] = useState('https://www.instagram.com/reels/');
  const [totalScrolls, setTotalScrolls] = useState(0);
  const [screenScrollCounts, setScreenScrollCounts] = useState<Map<number, number>>(new Map());

  const addScreen = useCallback((url?: string) => {
    const id = ++screenIdCounter;
    const newScreen: Screen = { id, name: `Screen ${id}`, url: url || globalUrl };
    setScreens((prev) => [...prev, newScreen]);
    setScreenScrollCounts((prev) => new Map(prev).set(id, 0));
    setShowAddModal(false);
    setModalUrl(globalUrl);
  }, [globalUrl]);

  const removeScreen = useCallback((id: number) => {
    setScreens((prev) => prev.filter((s) => s.id !== id));
    setScreenScrollCounts((prev) => { const next = new Map(prev); next.delete(id); return next; });
  }, []);

  const renameScreen = useCallback((id: number, name: string) => {
    setScreens((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  const navigateScreen = useCallback((id: number, url: string) => {
    setScreens((prev) => prev.map((s) => (s.id === id ? { ...s, url } : s)));
  }, []);

  const recordScroll = useCallback((screenId: number) => {
    setTotalScrolls((t) => t + 1);
    setScreenScrollCounts((prev) => {
      const next = new Map(prev);
      next.set(screenId, (next.get(screenId) || 0) + 1);
      return next;
    });
  }, []);

  const addMultipleScreens = useCallback(() => {
    ['https://www.instagram.com/reels/', 'https://www.youtube.com/shorts/', 'https://www.tiktok.com/']
      .forEach((url, i) => setTimeout(() => addScreen(url), i * 200));
  }, [addScreen]);

  const avgScrolls = screens.length > 0 ? Math.round(totalScrolls / screens.length) : 0;

  return (
    <div className="app-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-drag">
          <span className="title-bar-logo">⬡</span>
          <span className="title-bar-title">Social Media Dashboard — Web</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="control-bar-left">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <span className="btn-icon-text">+</span> Add Screen
          </button>
          <button className="btn-secondary" onClick={addMultipleScreens}>
            <span className="btn-icon-text">⚡</span> Quick Add 3
          </button>
          <div className="separator" />
          <div className="url-input-group">
            <label htmlFor="global-url">Default URL:</label>
            <input id="global-url" type="url" className="url-input" value={globalUrl}
              onChange={(e) => setGlobalUrl(e.target.value)} placeholder="https://www.instagram.com/reels/" />
          </div>
        </div>
        <div className="control-bar-right">
          <div className="screen-counter">
            <span className="counter-label">Screens:</span>
            <span className="counter-value">{screens.length}</span>
          </div>
          <button className={`btn-scroll-toggle ${autoScrollActive ? 'active' : ''}`}
            onClick={() => setAutoScrollActive((p) => !p)}>
            <span className="scroll-icon">{autoScrollActive ? '⏸' : '▶'}</span>
            <span className="scroll-label">Auto Scroll: {autoScrollActive ? 'ON' : 'OFF'}</span>
            {autoScrollActive && <span className="pulse-dot" />}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
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
            <span className="stat-value">{screens.length}</span>
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
          <span className="stat-icon">{autoScrollActive ? '🟢' : '🔴'}</span>
          <div className="stat-content">
            <span className="stat-value">{autoScrollActive ? 'ACTIVE' : 'IDLE'}</span>
            <span className="stat-label">Engine Status</span>
          </div>
        </div>
      </div>

      {/* Screen Grid */}
      <div className="screen-grid">
        {screens.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <h2>No Screens Active</h2>
            <p>Click "Add Screen" to start a new browser session</p>
            <button className="btn-primary" onClick={() => addScreen()}>+ Add First Screen</button>
          </div>
        )}
        {screens.map((screen) => (
          <WebScreenCard
            key={screen.id}
            screen={screen}
            onRemove={removeScreen}
            onRename={renameScreen}
            onNavigate={navigateScreen}
            autoScrollActive={autoScrollActive}
            onScrollExecuted={recordScroll}
            scrollCount={screenScrollCounts.get(screen.id) ?? 0}
          />
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Screen</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label htmlFor="url-input">URL</label>
              <input id="url-input" type="url" value={modalUrl}
                onChange={(e) => setModalUrl(e.target.value)}
                placeholder="https://www.instagram.com/reels/" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && modalUrl.trim() && addScreen(modalUrl)} />
              <div className="preset-urls">
                <button className="btn-preset" onClick={() => setModalUrl('https://www.instagram.com/reels/')}>Instagram Reels</button>
                <button className="btn-preset" onClick={() => setModalUrl('https://www.youtube.com/shorts/')}>YouTube Shorts</button>
                <button className="btn-preset" onClick={() => setModalUrl('https://www.tiktok.com/')}>TikTok</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => modalUrl.trim() && addScreen(modalUrl)} disabled={!modalUrl.trim()}>Add Screen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
