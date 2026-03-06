# TabPilot - Chrome Tab & Window Manager Extension

## Original Problem Statement
Build a Chrome Extension called "TabPilot" — a sidebar-based tab and window manager. All windows/tabs in a tree view with search, filter, group, reorder, close, pin, mute, move tabs, save sessions, detect duplicates.

## Architecture
- **Web Preview**: React 18 + Tailwind CSS frontend (port 3000) with interactive sidebar
- **Chrome Extension**: Manifest V3, vanilla JS side panel with Chrome APIs
- **Backend**: FastAPI (port 8001) with MongoDB for session persistence

## What's Been Implemented (2026-03-06)
### Iteration 1 - MVP
- Full interactive sidebar with mock tab data (14 tabs, 3 windows, 1 tab group)
- All 11 core features: search, tab tree, domain grouping, duplicates, drag & drop, sessions, quick actions, stats, context menu, tab groups, keyboard shortcuts
- Chrome Extension source files with Manifest V3
- Dark/Light/System theme support

### Iteration 2 - UI Overhaul + New Features
- **Sidebar moved to LEFT** (from right)
- **UI decluttered**: Removed grip handles, cleaner tab items with absolute accent bar, subtler window headers, better spacing
- **Memory/CPU stats**: StatsBar shows total memory (2.5 GB), avg CPU (4.5%), tab/audible/pinned/duplicate counts
- **Tab Activity Heatmap**: Top Domains heat bars (color-coded cold→hot), Most Visited Tabs ranking, Suggested Workflow session template builder
- **QuickActions expanded**: 7 buttons including Flame heatmap toggle
- TAB_METRICS data with per-tab memory, CPU, visit counts

## Prioritized Backlog
### P1
- [ ] Package extension as downloadable ZIP
- [ ] Persist visit counts across page reloads
- [ ] Tab suspension feature (unload inactive tabs)

### P2
- [ ] Chrome Web Store listing
- [ ] Extension Vite build setup
- [ ] Multi-device session sync
- [ ] Tab analytics dashboard
