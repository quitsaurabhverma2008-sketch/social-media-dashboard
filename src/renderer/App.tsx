import React, { useState, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import ControlBar from './components/ControlBar';
import ScreenCard from './components/ScreenCard';

export interface Screen {
  id: number;
  name: string;
  url: string;
}

// Type for electronAPI exposed by preload-main
interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  startAllAutoScroll: () => void;
  stopAllAutoScroll: () => void;
  startAutoScroll: (screenId: number) => void;
  stopAutoScroll: (screenId: number) => void;
  registerWebview: (screenId: number) => void;
  unregisterWebview: (screenId: number) => void;
  onExecuteScroll: (callback: (screenId: number) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

let screenIdCounter = 0;

export default function App() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [globalUrl, setGlobalUrl] = useState('https://www.instagram.com/reels/');
  const [showAddModal, setShowAddModal] = useState(false);

  const addScreen = useCallback((url?: string) => {
    const id = ++screenIdCounter;
    const newScreen: Screen = {
      id,
      name: `Screen ${id}`,
      url: url || globalUrl,
    };
    setScreens((prev) => [...prev, newScreen]);
    setShowAddModal(false);
  }, [globalUrl]);

  const removeScreen = useCallback((id: number) => {
    if (autoScrollActive && window.electronAPI) {
      window.electronAPI.stopAutoScroll(id);
      window.electronAPI.unregisterWebview(id);
    }
    setScreens((prev) => prev.filter((s) => s.id !== id));
  }, [autoScrollActive]);

  const renameScreen = useCallback((id: number, name: string) => {
    setScreens((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  const navigateScreen = useCallback((id: number, url: string) => {
    setScreens((prev) =>
      prev.map((s) => (s.id === id ? { ...s, url } : s))
    );
  }, []);

  const toggleAutoScroll = useCallback(() => {
    if (!window.electronAPI) return;

    setAutoScrollActive((prev) => {
      const next = !prev;
      if (next) {
        window.electronAPI.startAllAutoScroll();
      } else {
        window.electronAPI.stopAllAutoScroll();
      }
      return next;
    });
  }, []);

  const addMultipleScreens = useCallback(() => {
    const defaults = [
      'https://www.instagram.com/reels/',
      'https://www.youtube.com/shorts/',
      'https://www.tiktok.com/',
    ];
    defaults.forEach((url, i) => {
      setTimeout(() => addScreen(url), i * 200);
    });
  }, [addScreen]);

  return (
    <div className="app-container">
      <TitleBar />
      <ControlBar
        autoScrollActive={autoScrollActive}
        onToggleAutoScroll={toggleAutoScroll}
        onAddScreen={() => setShowAddModal(true)}
        onAddBatch={addMultipleScreens}
        screenCount={screens.length}
        globalUrl={globalUrl}
        onGlobalUrlChange={setGlobalUrl}
      />

      <div className="screen-grid">
        {screens.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <h2>No Screens Active</h2>
            <p>Click "Add Screen" to start a new isolated browser session</p>
            <button className="btn-primary" onClick={() => addScreen()}>
              + Add First Screen
            </button>
          </div>
        )}

        {screens.map((screen) => (
          <ScreenCard
            key={screen.id}
            screen={screen}
            onRemove={removeScreen}
            onRename={renameScreen}
            onNavigate={navigateScreen}
            autoScrollActive={autoScrollActive}
          />
        ))}
      </div>

      {showAddModal && (
        <AddScreenModal
          onAdd={addScreen}
          onClose={() => setShowAddModal(false)}
          defaultUrl={globalUrl}
        />
      )}
    </div>
  );
}

interface AddScreenModalProps {
  onAdd: (url: string) => void;
  onClose: () => void;
  defaultUrl: string;
}

function AddScreenModal({ onAdd, onClose, defaultUrl }: AddScreenModalProps) {
  const [url, setUrl] = useState(defaultUrl);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Screen</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label htmlFor="url-input">URL</label>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/reels/"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim()) onAdd(url.trim());
            }}
          />
          <div className="preset-urls">
            <button className="btn-preset" onClick={() => setUrl('https://www.instagram.com/reels/')}>
              Instagram Reels
            </button>
            <button className="btn-preset" onClick={() => setUrl('https://www.youtube.com/shorts/')}>
              YouTube Shorts
            </button>
            <button className="btn-preset" onClick={() => setUrl('https://www.tiktok.com/')}>
              TikTok
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => url.trim() && onAdd(url.trim())}
            disabled={!url.trim()}
          >
            Add Screen
          </button>
        </div>
      </div>
    </div>
  );
}
