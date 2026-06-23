// Preload script for webview isolation sessions - plain JS
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('webviewAPI', {
  onExecuteScroll: (callback) => {
    ipcRenderer.on('execute-scroll', () => callback());
  },
});
