import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScreenCardProps {
  screen: {
    id: number;
    name: string;
    url: string;
  };
  onRemove: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onNavigate: (id: number, url: string) => void;
  autoScrollActive: boolean;
  onScrollExecuted?: (screenId: number) => void;
  scrollCount?: number;
}

// Electron webview element type (not in standard DOM types)
interface ElectronWebviewElement extends HTMLElement {
  src: string;
  partition: string;
  allowpopups: string;
  useragent: string;
  getURL(): string;
  loadURL(url: string): void;
  isDestroyed(): boolean;
  executeJavaScript(code: string): Promise<unknown>;
  reload(): void;
  canGoBack(): boolean;
  goBack(): void;
  canGoForward(): boolean;
  goForward(): void;
}

export default function ScreenCard({
  screen,
  onRemove,
  onRename,
  onNavigate,
  autoScrollActive,
  onScrollExecuted,
  scrollCount = 0,
}: ScreenCardProps) {
  const webviewRef = useRef<ElectronWebviewElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(screen.name);
  const [currentUrl, setCurrentUrl] = useState(screen.url);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webviewError, setWebviewError] = useState<string | null>(null);

  const partition = `persist:session_${screen.id}`;

  // Register/unregister webview with main process for auto-scroll
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.registerWebview(screen.id);
    }
    return () => {
      if (window.electronAPI) {
        window.electronAPI.unregisterWebview(screen.id);
      }
    };
  }, [screen.id]);

  // Unified callback for all navigation events
  const handleNavigateUpdate = useCallback(() => {
    if (webviewRef.current) {
      setCurrentUrl(webviewRef.current.getURL());
    }
  }, []);

  const handleDidFailLoad = useCallback(() => {
    setWebviewError('Failed to load page');
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const onDidFinishLoad = () => {
      setIsLoaded(true);
      setWebviewError(null);
    };

    webview.addEventListener('did-navigate', handleNavigateUpdate);
    webview.addEventListener('did-navigate-in-page', handleNavigateUpdate);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('did-finish-load', onDidFinishLoad);

    return () => {
      webview.removeEventListener('did-navigate', handleNavigateUpdate);
      webview.removeEventListener('did-navigate-in-page', handleNavigateUpdate);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('did-finish-load', onDidFinishLoad);
    };
  }, [handleNavigateUpdate, handleDidFailLoad]);

  // Listen for main process scroll commands via electronAPI
  // Each screen runs its own async loop with randomized intervals (15s-45s)
  useEffect(() => {
    if (!window.electronAPI) return;

    const removeListener = window.electronAPI.onExecuteScroll((screenId: number) => {
      if (screenId !== screen.id) return;

      const webview = webviewRef.current;
      if (!webview || webview.isDestroyed()) return;

      // Randomize scroll distance per-scroll for anti-bot detection
      const scrollAmount = Math.floor(400 + Math.random() * 600); // 400-1000px
      // Randomize slight pause before scrolling (500-2000ms human delay)
      const humanDelay = Math.floor(500 + Math.random() * 1500);

      setTimeout(() => {
        if (!webview || webview.isDestroyed()) return;

        const scrollJS = `
          (function() {
            var scrollTarget = document.scrollingElement || document.documentElement;
            if (scrollTarget) {
              scrollTarget.scrollTo({
                top: scrollTarget.scrollTop + ${scrollAmount},
                behavior: 'smooth'
              });
            }
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true
            }));
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'j', code: 'KeyJ', keyCode: 74, which: 74, bubbles: true
            }));
          })()
        `;
        webview.executeJavaScript(scrollJS).catch(() => {});
        if (onScrollExecuted) onScrollExecuted(screen.id);
      }, humanDelay);
    });

    return () => {
      removeListener();
    };
  }, [screen.id, onScrollExecuted]);

  const handleReload = useCallback(() => {
    const webview = webviewRef.current;
    if (webview && !webview.isDestroyed()) {
      webview.reload();
    }
  }, []);

  const handleGoBack = useCallback(() => {
    const webview = webviewRef.current;
    if (webview && !webview.isDestroyed() && webview.canGoBack()) {
      webview.goBack();
    }
  }, []);

  const handleGoForward = useCallback(() => {
    const webview = webviewRef.current;
    if (webview && !webview.isDestroyed() && webview.canGoForward()) {
      webview.goForward();
    }
  }, []);

  // Actually navigate the webview using loadURL
  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const webview = webviewRef.current;
      if (webview && !webview.isDestroyed() && currentUrl.trim()) {
        let url = currentUrl.trim();
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }
        setIsLoaded(false);
        setWebviewError(null);
        webview.loadURL(url);
        onNavigate(screen.id, url);
      }
    },
    [screen.id, currentUrl, onNavigate]
  );

  const handleNameSave = useCallback(() => {
    setIsEditing(false);
    if (editName.trim()) {
      onRename(screen.id, editName.trim());
    }
  }, [editName, screen.id, onRename]);

  const webviewJsxRef = webviewRef as unknown as React.Ref<HTMLElement>;

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
            <span
              className="screen-name"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              {screen.name}
            </span>
          )}
          <span className="screen-id">#{screen.id}</span>
        {autoScrollActive && (
          <span className="scroll-active-badge">🔄 Auto</span>
        )}
        {scrollCount > 0 && (
          <span className="scroll-count-badge">{scrollCount} scrolls</span>
        )}
        </div>

        <div className="screen-controls">
          <button className="btn-small" onClick={handleGoBack} title="Back">◀</button>
          <button className="btn-small" onClick={handleGoForward} title="Forward">▶</button>
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
        <webview
          ref={webviewJsxRef}
          src={screen.url}
          partition={partition}
          className="screen-webview"
          style={{ display: isLoaded ? 'block' : 'none' }}
          allowpopups={true}
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        />
      </div>

      <div className="screen-card-footer">
        <span className="session-label" title={partition}>
          🔒 Isolated Session
        </span>
      </div>
    </div>
  );
}
