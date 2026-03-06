# TabPilot Chrome Extension

## Installation (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this `tabpilot` folder
5. Click the TabPilot icon in your toolbar or press **Ctrl+Shift+E** to open the sidebar

## Features

- **Tab Tree View** — See all windows and tabs in real-time
- **Global Search** — Fuzzy search across all tabs (Cmd+K for quick switch)
- **Chrome Tab Groups** — Full integration with native tab groups
- **Duplicate Detection** — Find and close duplicate tabs
- **Drag & Drop** — Reorder and move tabs between windows
- **Session Manager** — Save and restore tab sessions
- **Activity Heatmap** — Track time spent on each site (day/week/month)
- **Tab Timeline** — GitHub-contributions-style activity grid
- **Focus Mode** — Hide distractions, show only core tabs
- **Tab Suspension** — Free memory by suspending inactive tabs
- **Tab Notes** — Attach quick notes to any tab
- **Smart Workspaces** — Named presets + custom workspace creation
- **Auto-Close Rules** — Automatically close inactive tabs
- **Tab Previews** — Hover any tab for a rich preview card
- **Command Palette** — Press Cmd+K to fuzzy-search and jump to any tab
- **Help & Feedback** — Built-in guide and suggestion form

## Privacy

TabPilot runs entirely in your browser. We **never** collect, store, or transmit any browser data — no passwords, no browsing history, no personal information. All tab management happens locally on your device.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+E | Toggle sidebar |
| Cmd+K / Ctrl+K | Command palette |
| Ctrl+Shift+F | Focus search |
| Arrow Up/Down | Navigate tabs |
| Enter | Switch to tab |
| Delete | Close selected tab |
| Escape | Clear search |

## Tech Stack

- Manifest V3
- React 18
- Tailwind CSS
- Chrome APIs: tabs, tabGroups, sidePanel, storage
