// Content script injected into Instagram, YouTube, TikTok, etc.
// Listens for scroll commands from background service worker

(function () {
  'use strict';

  // Listen for scroll commands from extension background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'EXECUTE_SCROLL':
        executeScroll(message.amount);
        sendResponse({ success: true });
        break;
      case 'PING':
        sendResponse({ alive: true });
        break;
    }
  });

  function executeScroll(amount) {
    const scrollAmount = amount || Math.floor(400 + Math.random() * 600);
    const target = findScrollableElement() || document.scrollingElement || document.documentElement;

    target.scrollBy({ top: scrollAmount, behavior: 'smooth' });

    // Simulate keyboard events for anti-bot evasion
    simulateKeyDown('ArrowDown', 40);
    simulateKeyDown('j', 74);
    simulateKeyDown(' ', 32);
  }

  function findScrollableElement() {
    const selectors = [
      '#shorts-container',            // YouTube Shorts
      'ytd-shorts',                   // YouTube Shorts web component
      'ytd-reel-video-renderer',
      'div[data-e2e="recommend-list"]',  // TikTok
      'div[data-e2e="feed-content"]',
      'div[role="feed"]',             // Facebook
      'main[role="main"]',            // Instagram
      'article',
      'div[data-testid="primaryColumn"]', // X/Twitter
      'div[data-pagelet="root"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        if (el.tagName === 'YTDSHORTS' || el.tagName === 'YTD-REEL-VIDEO-RENDERER') return el;
        if (el.scrollHeight > el.clientHeight) return el;
      }
    }
    return null;
  }

  function simulateKeyDown(key, keyCode) {
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key, keyCode, which: keyCode,
        code: key === ' ' ? 'Space' : key,
        bubbles: true, cancelable: true
      }));
    } catch (e) { /* cross-origin or blocked */ }
  }

  chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED', url: window.location.href });
})();
