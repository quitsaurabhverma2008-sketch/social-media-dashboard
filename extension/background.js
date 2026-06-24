// Maps screen IDs to tab IDs for scrolling
const screenTabs = new Map();
// Maps screen IDs to auto-scroll timer state
const autoScrollState = new Map();

// Listen for messages from content scripts (dashboard-bridge and content)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PING':
      // Dashboard checks if extension is installed
      sendResponse({ installed: true, version: '1.0.0' });
      break;

    case 'REGISTER_SCREEN':
      handleRegisterScreen(message, sender, sendResponse);
      return true; // Keep channel open for async response

    case 'UNREGISTER_SCREEN':
      handleUnregisterScreen(message);
      break;

    case 'EXECUTE_SCROLL':
      handleScrollCommand(message);
      break;

    case 'START_AUTOSCROLL':
      handleStartAutoScroll(message);
      break;

    case 'STOP_AUTOSCROLL':
      handleStopAutoScroll(message);
      break;

    case 'STOP_ALL_AUTOSCROLL':
      handleStopAllAutoScroll();
      break;

    case 'SCROLL_EXECUTED':
      // Forward scroll confirmation back to dashboard
      forwardToDashboard({ type: 'SCROLL_EXECUTED', screenId: message.screenId });
      break;
  }
});

// Open or find a tab for a screen
async function handleRegisterScreen(message, sender, sendResponse) {
  const { screenId, url } = message;

  // Check if we already manage this screen
  if (screenTabs.has(screenId)) {
    const existingTabId = screenTabs.get(screenId);
    try {
      const tab = await chrome.tabs.get(existingTabId);
      if (tab && !tab.discarded) {
        sendResponse({ success: true, tabId: existingTabId, action: 'exists' });
        return;
      }
    } catch (e) {
      // Tab no longer exists, clean up
      screenTabs.delete(screenId);
    }
  }

  // Try to find an existing tab with this URL
  try {
    const tabs = await chrome.tabs.query({ url: getUrlPatterns(url) });
    const matchingTab = tabs.find(t => t.url && urlsMatch(t.url, url));
    if (matchingTab) {
      screenTabs.set(screenId, matchingTab.id);
      // Inject content script if not already present
      try {
        await chrome.scripting.executeScript({
          target: { tabId: matchingTab.id },
          files: ['content.js']
        });
      } catch (e) { /* Already injected */ }
      sendResponse({ success: true, tabId: matchingTab.id, action: 'found' });
      return;
    }
  } catch (e) {
    // URL pattern query failed
  }

  // No existing tab found, create new one
  try {
    const tab = await chrome.tabs.create({ url, active: false });
    screenTabs.set(screenId, tab.id);
    // Respond immediately, tab will be ready by the time first scroll happens
    sendResponse({ success: true, tabId: tab.id, action: 'created' });
  } catch (e) {
    sendResponse({ success: false, error: e.message });
  }
}

function handleUnregisterScreen(message) {
  const { screenId } = message;
  stopAutoScrollForScreen(screenId);
  screenTabs.delete(screenId);
  autoScrollState.delete(screenId);
}

function handleScrollCommand(message) {
  const { screenId, amount } = message;
  const tabId = screenTabs.get(screenId);
  if (!tabId) return;

  const scrollAmount = amount || Math.floor(400 + Math.random() * 600);
  const humanDelay = Math.floor(500 + Math.random() * 1500);

  setTimeout(() => {
    chrome.tabs.sendMessage(tabId, {
      type: 'EXECUTE_SCROLL',
      amount: scrollAmount
    }).catch(() => {
      // Tab might be closed or content script not loaded
    });
  }, humanDelay);
}

function handleStartAutoScroll(message) {
  const { screenId } = message;
  scheduleNextScroll(screenId);
}

function handleStopAutoScroll(message) {
  stopAutoScrollForScreen(message.screenId);
}

function handleStopAllAutoScroll() {
  for (const screenId of autoScrollState.keys()) {
    stopAutoScrollForScreen(screenId);
  }
}

function scheduleNextScroll(screenId) {
  if (autoScrollState.get(screenId) === false) return;

  const delay = Math.floor(15000 + Math.random() * 30000); // 15-45s

  const timerId = setTimeout(() => {
    handleScrollCommand({ screenId });
    // Notify dashboard that scroll was executed
    forwardToDashboard({ type: 'SCROLL_EXECUTED', screenId });
    // Schedule next
    scheduleNextScroll(screenId);
  }, delay);

  autoScrollState.set(screenId, timerId);
}

function stopAutoScrollForScreen(screenId) {
  const timerId = autoScrollState.get(screenId);
  if (typeof timerId === 'number') {
    clearTimeout(timerId);
  }
  autoScrollState.set(screenId, false);
}

// Forward messages to the dashboard bridge content script
async function forwardToDashboard(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && tab.url.includes('social-media-dashboard')) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  } catch (e) {
    // No dashboard tab found
  }
}

// Helper: Get URL match patterns for tab querying
function getUrlPatterns(url) {
  try {
    const u = new URL(url);
    return `*://${u.hostname}/*`;
  } catch {
    return '*://*/*';
  }
}

// Helper: Check if two URLs match (ignoring trailing slashes, query params)
function urlsMatch(url1, url2) {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    return u1.hostname === u2.hostname && u1.pathname.replace(/\/$/, '') === u2.pathname.replace(/\/$/, '');
  } catch {
    return false;
  }
}

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [screenId, id] of screenTabs) {
    if (id === tabId) {
      screenTabs.delete(screenId);
      autoScrollState.delete(screenId);
      forwardToDashboard({ type: 'TAB_CLOSED', screenId });
      break;
    }
  }
});

console.log('Social Media Auto-Scroll Extension loaded');
