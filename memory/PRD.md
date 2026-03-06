# TabPilot - Chrome Tab & Window Manager Extension

## Original Problem Statement
Build a Chrome Extension called "TabPilot" — a sidebar-based tab and window manager that gives full control over all open browser windows and tabs from one clean panel. Opens as a Chrome Side Panel with tree view of all windows/tabs. Features: search, filter, group, reorder, close, pin, mute, move tabs, save sessions, detect duplicates.

## Architecture
- **Web Preview**: React 18 + Tailwind CSS frontend (port 3000) with interactive sidebar simulation
- **Chrome Extension**: Manifest V3, vanilla JS side panel with Chrome APIs
- **Backend**: FastAPI (port 8001) with MongoDB for session persistence
- **No external integrations** - everything runs locally

## User Personas
1. **Power User/Developer**: 50+ tabs across multiple windows, needs organization
2. **Researcher**: Multiple topic windows, needs session save/restore
3. **Casual User**: Wants to find and close duplicate tabs easily

## Core Requirements (Static)
- Real-time tab tree view with all windows
- Global search across all tabs
- Group by Window / Group by Domain toggle
- Duplicate tab detection and cleanup
- Drag & drop tab reordering
- Session save/restore
- Quick actions bar
- Tab stats bar
- Right-click context menu
- Chrome tab groups support
- Keyboard shortcuts
- Dark/Light/System theme

## What's Been Implemented (2026-03-06)
### Web Preview (Primary Deliverable)
- Full interactive sidebar with mock tab data (14 tabs, 3 windows)
- Real-time search with highlight and result count
- Tab actions: click to switch, close, pin/unpin, mute/unmute
- Window actions: minimize, close, collapse/expand
- Tab group display (Work group with blue color)
- Domain grouping view toggle
- Duplicate detection panel with "Fix All" button
- Session manager (save/restore/delete with localStorage)
- Settings panel (theme, favicons, URLs, compact mode, auto-close duplicates)
- Stats bar (windows, tabs, audible, pinned, duplicates)
- Right-click context menu (switch, pin, mute, duplicate, move to, close, copy URL)
- Native HTML drag & drop for tab reordering
- Keyboard shortcuts (Ctrl+Shift+F search, arrow keys, Enter, Delete, Escape)
- JetBrains Mono + Manrope typography
- Dark navy theme (#1a1a2e) with electric cyan (#4cc9f0) accents
- Browser mockup frame for realistic preview

### Chrome Extension (Secondary)
- Complete Manifest V3 manifest.json
- Background service worker with badge, shortcuts, event listeners
- Side panel HTML/CSS/JS with Tailwind CDN
- Extension icons (16/48/128px)
- README with installation instructions

### Backend API
- POST /api/sessions (201) - Save session
- GET /api/sessions - List sessions
- DELETE /api/sessions/{id} - Delete session

## Prioritized Backlog
### P0 (Done)
- [x] All 11 features implemented in web preview
- [x] Chrome Extension source files created

### P1 (Next)
- [ ] Package extension as downloadable ZIP from web preview
- [ ] Add tab memory/CPU usage simulation in stats
- [ ] Persist theme preference across page reloads
- [ ] Add more mock data variety

### P2 (Future)
- [ ] Browser extension store listing preparation
- [ ] Extension Vite build setup for production
- [ ] Analytics dashboard for tab usage patterns
- [ ] Tab suspension (unload inactive tabs)
- [ ] Multi-device session sync
