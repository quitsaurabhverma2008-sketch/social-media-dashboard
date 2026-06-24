// Dashboard Bridge - injected into Social Media Dashboard page
// Provides window.__autoScrollExtension object for the dashboard React app
// Communicates with extension background service worker

(function () {
  'use strict';

  let extensionConnected = false;

  // Check if extension is installed and connect
  function checkConnection() {
    try {
      chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
        if (response && response.installed) {
          extensionConnected = true;
          dispatchConnectionEvent(true);
        } else {
          dispatchConnectionEvent(false);
        }
      });
    } catch (e) {
      extensionConnected = false;
      dispatchConnectionEvent(false);
    }
  }

  function dispatchConnectionEvent(connected) {
    window.dispatchEvent(new CustomEvent('extension-connection-change', {
      detail: { connected }
    }));
  }

  // Register a screen with the extension
  async function registerScreen(screenId, url) {
    if (!extensionConnected) return { success: false, error: 'Extension not connected' };

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'REGISTER_SCREEN', screenId, url }, (response) => {
        resolve(response || { success: false, error: 'No response' });
      });
    });
  }

  // Unregister a screen
  function unregisterScreen(screenId) {
    if (!extensionConnected) return;
    chrome.runtime.sendMessage({ type: 'UNREGISTER_SCREEN', screenId });
  }

  // Execute a single scroll
  function executeScroll(screenId, amount) {
    if (!extensionConnected) return;
    chrome.runtime.sendMessage({ type: 'EXECUTE_SCROLL', screenId, amount });
  }

  // Start auto-scroll for a screen
  function startAutoScroll(screenId) {
    if (!extensionConnected) return;
    chrome.runtime.sendMessage({ type: 'START_AUTOSCROLL', screenId });
  }

  // Stop auto-scroll for a screen
  function stopAutoScroll(screenId) {
    if (!extensionConnected) return;
    chrome.runtime.sendMessage({ type: 'STOP_AUTOSCROLL', screenId });
  }

  // Stop all auto-scroll
  function stopAllAutoScroll() {
    if (!extensionConnected) return;
    chrome.runtime.sendMessage({ type: 'STOP_ALL_AUTOSCROLL' });
  }

  // Listen for forwarded messages from background
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case 'SCROLL_EXECUTED':
        window.dispatchEvent(new CustomEvent('extension-scroll-executed', {
          detail: { screenId: message.screenId }
        }));
        break;
      case 'TAB_CLOSED':
        window.dispatchEvent(new CustomEvent('extension-tab-closed', {
          detail: { screenId: message.screenId }
        }));
        break;
    }
  });

  // Expose API for the dashboard React app
  window.__autoScrollExtension = {
    get connected() { return extensionConnected; },
    checkConnection,
    registerScreen,
    unregisterScreen,
    executeScroll,
    startAutoScroll,
    stopAutoScroll,
    stopAllAutoScroll
  };

  // Auto-check on load
  setTimeout(checkConnection, 300);
})();
