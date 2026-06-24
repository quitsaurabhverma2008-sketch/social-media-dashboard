# Social Media Auto-Scroll Extension

Chrome extension for cross-origin auto-scrolling in Social Media Dashboard.

## Installation

1. Download `social-media-autoscroll-extension.zip`
2. Unzip it anywhere on your computer
3. Open **Chrome** and go to `chrome://extensions`
4. Enable **"Developer mode"** (top right)
5. Click **"Load unpacked"**
6. Select the unzipped `extension` folder

## Usage

1. Open [Social Media Dashboard](https://social-media-dashboard-quitsaurabhverma2008-9330s-projects.vercel.app)
2. You'll see **"Extension Active"** (green dot) in the title bar
3. Add screens with Instagram/YouTube/TikTok URLs
4. Extension opens real browser tabs for each screen
5. Toggle **Auto-Scroll ON** — scrolling works in the real tabs!

## Supported Sites

- Instagram Reels
- YouTube Shorts
- TikTok
- Facebook
- X (Twitter)

## How It Works

```
Dashboard → dashboard-bridge.js → background.js (timer) → content.js (scroll) → Real Tab
```

The extension injects `content.js` into social media sites, which listens for scroll commands from the background service worker. The background worker manages the 15-45s randomized scroll interval per screen.
