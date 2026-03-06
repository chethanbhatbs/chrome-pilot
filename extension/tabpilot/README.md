# TabPilot Chrome Extension — Installation Guide

## Quick Install

1. **Get the extension folder**: `tabpilot/` (the folder containing `manifest.json`)
2. Open Chrome and go to: `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked** and select the `tabpilot/` folder
5. The TabPilot icon appears in your toolbar
6. Open the sidebar: `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)

## Features

- **Tab Tree** — All windows and tabs in a collapsible sidebar
- **Fuzzy Search** — Find any tab instantly (`Cmd+K` or `Ctrl+K`)
- **Workspaces** — Save and restore sets of tabs (`Ctrl+1/2/3`)
- **Focus Mode** — Hide distractions, set a timer
- **Heatmap** — See which tabs you use most
- **Tab Suspension** — Discard inactive tabs to free memory
- **Tab Notes** — Attach notes to any tab (persisted locally)
- **Duplicate Detection** — Find and close duplicate tabs
- **Undo Close** — Restore the last closed tab from a toast notification
- **Window Rename** — Double-click any window name to rename it

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` / `Cmd+Shift+E` | Toggle sidebar |
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `Ctrl+1/2/3` | Switch workspace |

## Rebuilding After Code Changes

```bash
cd /app && bash build-extension.sh
```

## Permissions Required

| Permission | Why |
|-----------|-----|
| `tabs` | Read tab titles, URLs, status |
| `windows` | Manage browser windows |
| `tabGroups` | Show Chrome tab groups |
| `sidePanel` | Render sidebar |
| `storage` | Save notes and window names |
| `sessions` | Undo closed tabs |
| `activeTab` | Read active tab info |
