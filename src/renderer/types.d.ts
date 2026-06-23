declare module '*.css';

// Electron webview JSX intrinsic element - use loose typing to avoid conflicts
declare namespace JSX {
  interface IntrinsicElements {
    webview: Record<string, any>;
  }
}
