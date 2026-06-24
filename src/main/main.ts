import { app, BrowserWindow, ipcMain, WebContents } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

// Store active auto-scroll timers per screen
const autoScrollTimers: Map<number, ReturnType<typeof setTimeout> | null> = new Map();
const screenWebContents: Map<number, WebContents> = new Map();

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Social Media Automation Dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload-main.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
    backgroundColor: '#0a0a0f',
    frame: false,
    titleBarStyle: 'hidden',
  });

  // In packaged app, __dirname points to dist/main/, so ../renderer/index.html works
  // In development, same path works since webpack outputs to dist/renderer/
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Clear all timers
    autoScrollTimers.forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
    autoScrollTimers.clear();
    screenWebContents.clear();
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  autoScrollTimers.forEach((timer) => {
    if (timer) clearTimeout(timer);
  });
  autoScrollTimers.clear();
  screenWebContents.clear();
  if (process.platform !== 'darwin') app.quit();
});

// Window control IPC handlers
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

// Register a webview's webContents for auto-scroll control
ipcMain.on('register-webview', (event, screenId: number) => {
  const webContents = event.sender;
  screenWebContents.set(screenId, webContents);
});

ipcMain.on('unregister-webview', (_event, screenId: number) => {
  screenWebContents.delete(screenId);
  const timer = autoScrollTimers.get(screenId);
  if (timer) clearTimeout(timer);
  autoScrollTimers.delete(screenId);
});

// Start auto-scroll for a specific screen with random interval
function startAutoScrollForScreen(screenId: number): void {
  // Clear any existing timer for this screen
  const existingTimer = autoScrollTimers.get(screenId);
  if (existingTimer) clearTimeout(existingTimer);

  // Random interval between 15000ms and 45000ms
  const randomInterval = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;

  const timer = setTimeout(() => {
    const webContents = screenWebContents.get(screenId);
    if (webContents && !webContents.isDestroyed()) {
      // Send scroll command to the renderer
      webContents.send('execute-scroll', screenId);
    }
    // Schedule next scroll with new random interval
    startAutoScrollForScreen(screenId);
  }, randomInterval);

  autoScrollTimers.set(screenId, timer);
}

// Stop auto-scroll for a specific screen
function stopAutoScrollForScreen(screenId: number): void {
  const timer = autoScrollTimers.get(screenId);
  if (timer) {
    clearTimeout(timer);
    autoScrollTimers.set(screenId, null);
  }
}

// IPC: Start all auto-scroll
ipcMain.on('start-all-autoscroll', () => {
  screenWebContents.forEach((_wc, screenId) => {
    startAutoScrollForScreen(screenId);
  });
});

// IPC: Stop all auto-scroll
ipcMain.on('stop-all-autoscroll', () => {
  autoScrollTimers.forEach((timer, screenId) => {
    if (timer) clearTimeout(timer);
    autoScrollTimers.set(screenId, null);
  });
});

// IPC: Start auto-scroll for a specific screen
ipcMain.on('start-autoscroll', (_event, screenId: number) => {
  startAutoScrollForScreen(screenId);
});

// IPC: Stop auto-scroll for a specific screen
ipcMain.on('stop-autoscroll', (_event, screenId: number) => {
  stopAutoScrollForScreen(screenId);
});
