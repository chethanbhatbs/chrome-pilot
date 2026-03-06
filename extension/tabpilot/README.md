# TabPilot - Chrome Tab & Window Manager Extension

A powerful Chrome Side Panel extension for managing all your browser windows and tabs from one clean panel.

## Features

- **Real-Time Tab Tree View** - Live, always-updated tree of all windows and tabs
- **Global Tab Search** - Fuzzy search across all tabs in all windows
- **Group by Domain** - Toggle between window and domain views
- **Duplicate Detection** - Find and close duplicate tabs
- **Drag & Drop** - Reorder and move tabs between windows
- **Session Manager** - Save and restore tab sessions
- **Quick Actions** - One-click common operations
- **Live Stats** - Real-time tab, window, and audio statistics
- **Right-Click Context Menu** - Full tab actions via context menu
- **Chrome Tab Groups** - Native tab group support
- **Keyboard Shortcuts** - Navigate and manage with hotkeys
- **Theme Support** - Dark, Light, and System auto-detect

## Installation

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `tabpilot/` folder
5. The TabPilot icon appears in your toolbar
6. Click it or press `Ctrl+Shift+E` to open the sidebar

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | Toggle sidebar |
| `Ctrl+Shift+F` | Focus search |
| `Ctrl+Shift+D` | Close duplicates |
| `Up/Down` | Navigate tabs |
| `Enter` | Switch to selected tab |
| `Delete` | Close selected tab |
| `Escape` | Clear search |

## Tech Stack

- Manifest V3
- Tailwind CSS (CDN)
- Vanilla JavaScript (no build step required)
- Chrome APIs: tabs, windows, sidePanel, storage, sessions, tabGroups, commands

## File Structure

```
tabpilot/
  manifest.json          # Extension manifest
  background.js          # Service worker
  sidepanel/
    index.html           # Side panel UI
    styles.css           # Custom styles
    app.js               # App logic (Chrome APIs)
  icons/
    icon16.png           # 16x16 icon
    icon48.png           # 48x48 icon
    icon128.png          # 128x128 icon
```

## Note

The icons need to be generated or provided. You can use any 16x16, 48x48, and 128x128 PNG icons.
If icons are missing, Chrome will use a default placeholder icon.
