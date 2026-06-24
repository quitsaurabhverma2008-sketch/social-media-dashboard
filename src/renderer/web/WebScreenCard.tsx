import React, { useRef, useState, useCallback, useEffect } from 'react';

interface WebScreenCardProps {
  screen: { id: number; name: string; url: string };
  onRemove: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onNavigate: (id: number, url: string) => void;
  autoScrollActive: boolean;
  onScrollExecuted?: (screenId: number) => void;
  scrollCount?: number;
}

// Web auto-scroll state per screen (uses number for browser setTimeout return type)
const webScrollTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();

export function stopWebAutoScroll(screenId: number) {
  const timer = webScrollTimers.get(screenId);
  if (timer) {
    clearTimeout(timer);
    webScrollTimers.delete(screenId);
  }
}

export function stopAllWebAutoScroll() {
  webScrollTimers.forEach((timer) => clearTimeout(timer));
  webScrollTimers.clear();
}

function hasExtension(): boolean {
  return typeof window !== 'undefined' &&
    (window as any).__autoScrollExtension?.connected === true;
}

function scheduleNextTick(screenId: number, onScroll: () => void) {
  const delay = Math.floor(15000 + Math.random() * 30000);
  webScrollTimers.set(screenId, setTimeout(() => {
    onScroll();
    scheduleNextTick(screenId, onScroll);
  }, delay));
}

function startFallbackAutoScroll(screenId: number, onScroll: () => void) {
  stopWebAutoScroll(screenId);
  const firstDelay = Math.floor(15000 + Math.random() * 30000);
  webScrollTimers.set(screenId, setTimeout(() => {
    onScroll();
    scheduleNextTick(screenId, onScroll);
  }, firstDelay));
}

export default function WebScreenCard({
  screen,
  onRemove,
  onRename,
  onNavigate,
  autoScrollActive,
  onScrollExecuted,
  scrollCount = 0,
}: WebScreenCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(screen.name);
  const [currentUrl, setCurrentUrl] = useState(screen.url);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webviewError, setWebviewError] = useState<string | null>(null);
  const [extConnected, setExtConnected] = useState(hasExtension());

  // Listen for extension connection changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setExtConnected(detail.connected);
    };
    window.addEventListener('extension-connection-change', handler);
    return () => window.removeEventListener('extension-connection-change', handler);
  }, []);

  // Auto-scroll: when extension connected, background timer handles timing.
  // When no extension, fallback to dashboard-side timer with postMessage.
  useEffect(() => {
    if (autoScrollActive && !hasExtension()) {
      // Fallback mode: client-side timer, scroll via postMessage (cross-origin limited)
      startFallbackAutoScroll(screen.id, () => {
        try {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'scroll', amount: Math.floor(400 + Math.random() * 600) }, '*');
          }
        } catch { /* cross-origin restriction */ }
        if (onScrollExecuted) onScrollExecuted(screen.id);
      });
    } else if (!autoScrollActive) {
      stopWebAutoScroll(screen.id);
    }
    // When extension is connected, dashboard timer is SKIPPED to avoid double-scrolling
    // The background service worker handles timing and sends SCROLL_EXECUTED events
    return () => stopWebAutoScroll(screen.id);
  }, [autoScrollActive, screen.id, onScrollExecuted]);

  const handleReload = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      setIsLoaded(false);
      setWebviewError(null);
      iframe.src = iframe.src;
    }
  }, []);

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (currentUrl.trim()) {
        let url = currentUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        setIsLoaded(false);
        setWebviewError(null);
        setCurrentUrl(url);
        onNavigate(screen.id, url);
      }
    },
    [screen.id, currentUrl, onNavigate]
  );

  const handleNameSave = useCallback(() => {
    setIsEditing(false);
    if (editName.trim()) onRename(screen.id, editName.trim());
  }, [editName, screen.id, onRename]);

  return (
    <div className="screen-card">
      <div className="screen-card-header">
        <div className="screen-info">
          {isEditing ? (
            <input
              className="screen-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              autoFocus
            />
          ) : (
            <span className="screen-name" onClick={() => setIsEditing(true)} title="Click to rename">
              {screen.name}
            </span>
          )}
          <span className="screen-id">#{screen.id}</span>
          {autoScrollActive && <span className="scroll-active-badge">🔄 Auto</span>}
          {scrollCount > 0 && <span className="scroll-count-badge">{scrollCount} scrolls</span>}
        </div>
        <div className="screen-controls">
          <button className="btn-small" onClick={handleReload} title="Reload">↻</button>
          <button className="btn-small btn-remove" onClick={() => onRemove(screen.id)} title="Remove">✕</button>
        </div>
      </div>

      <form className="screen-url-bar" onSubmit={handleUrlSubmit}>
        <input
          type="url"
          className="url-bar-input"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          placeholder="Enter URL..."
        />
        <button type="submit" className="btn-go">Go</button>
      </form>

      <div className="screen-webview-container">
        {!isLoaded && !webviewError && (
          <div className="webview-loading">
            <div className="spinner" />
            <span>Loading...</span>
          </div>
        )}
        {webviewError && (
          <div className="webview-error">
            <span>⚠️</span>
            <span>{webviewError}</span>
            <button className="btn-retry" onClick={handleReload}>Retry</button>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={screen.url}
          className="screen-webview"
          style={{ display: isLoaded ? 'block' : 'none' }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={() => { setIsLoaded(true); setWebviewError(null); }}
          onError={() => setWebviewError('Failed to load page')}
          title={screen.name}
        />
      </div>

      <div className="screen-card-footer">
        {extConnected ? (
          <span className="session-label ext-active" title="Extension connected - auto-scroll works in real tabs">
            🔌 Extension Auto-Scroll
          </span>
        ) : (
          <span className="session-label" title="No extension - auto-scroll timing active, cross-origin scroll limited. Install the extension for full functionality.">
            🌐 Web Mode {autoScrollActive ? '(timing active)' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
