// Preload script for the main renderer window
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Auto-scroll controls
  startAllAutoScroll: () => ipcRenderer.send('start-all-autoscroll'),
  stopAllAutoScroll: () => ipcRenderer.send('stop-all-autoscroll'),
  startAutoScroll: (screenId) => ipcRenderer.send('start-autoscroll', screenId),
  stopAutoScroll: (screenId) => ipcRenderer.send('stop-autoscroll', screenId),

  // Webview registration
  registerWebview: (screenId) => ipcRenderer.send('register-webview', screenId),
  unregisterWebview: (screenId) => ipcRenderer.send('unregister-webview', screenId),

  // Listen for scroll commands from main process - returns cleanup function
  onExecuteScroll: (callback) => {
    const handler = (_event, screenId) => callback(screenId);
    ipcRenderer.on('execute-scroll', handler);
    return () => ipcRenderer.removeListener('execute-scroll', handler);
  },
});
