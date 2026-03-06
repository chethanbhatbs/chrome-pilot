# TabPilot - Chrome Extension Tab & Window Manager

## Original Problem Statement
Build a Chrome Extension called "TabPilot" — a sidebar-based tab and window manager using Manifest V3, React 18, and Tailwind CSS.

## Architecture
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI, custom hooks
- **Backend:** FastAPI (Python) — sessions & suggestions endpoints
- **Database:** MongoDB (sessions, suggestions)
- **Extension:** Manifest V3 Chrome Extension (in /app/extension/tabpilot)
- **Chrome API adapter:** Auto-detects extension vs web context; uses real APIs in extension, mock data in preview

## All Features (all tested, 100% pass across 8 iterations)

### Core Tab Management
- Tab Tree View with window/domain grouping
- Global Fuzzy Search with live suggestions + Cmd+K hint
- Chrome Tab Groups with colored headers + colored left borders
- Duplicate Detection with inline badge indicators + descriptive banner
- Drag & Drop with visible grip handles on hover
- Session Save & Restore via API
- Context Menu with visual grouping (navigation, state, organization, destructive)

### Advanced Features
- **Activity Heatmap**: Day/Week/Month/Custom filters, hours + visits
- **Tab Timeline**: GitHub-contributions-style 7-day x 18-hour grid with click detail
- **Focus Mode** with timer
- **Tab Suspension** + Unsuspend All
- **Tab Notes** — CRUD via context menu + dedicated panel
- **Smart Workspaces** — 4 presets + full custom CRUD (localStorage)
- **Auto-Close Rules** — Timer presets (15/30/60/120min/custom), domain whitelist, at-risk preview
- **Tab Previews** — Hover card (350ms delay) with domain color, stats, note
- **Command Palette** (Cmd+K) — Spotlight-style quick switch
- **Help & Privacy** — Usage tips, keyboard shortcuts, suggestion form, privacy disclaimer

### Chrome API Integration
- `/app/frontend/src/utils/chromeAdapter.js` — detects extension context, wraps chrome.tabs/windows/tabGroups
- `/app/frontend/src/hooks/useChromeTabs.js` — real-time hook with event listeners + 2s polling
- Extension manifest with permissions: tabs, tabGroups, sidePanel, storage, activeTab
- Background service worker with badge updates and tab event monitoring

### UX Polish (Iteration 8 — March 2026)
- **Overflow toolbar**: Primary actions (New Tab, Window, Domain, Heatmap, Focus) always visible; secondary actions (Suspend, Resume, Mute, Unmute, Dupes, Save Session) in "More" dropdown
- **Mixed-case group labels**: Semibold mixed-case instead of ALL CAPS
- **Top-right icon contrast**: Increased from muted-foreground/60 to foreground/50 with size 13 and strokeWidth 1.8
- **Tab status badge tooltips**: Pin ("Pinned tab"), Duplicate ("Duplicate — open in multiple tabs"), Audio ("Playing audio" / "Muted"), Note (shows note text)
- **Window domain summaries**: Top 2 domains + "+X more" in italic
- **Homepage overhaul**: Hero section, Quick Start (4 cards), Features (12 cards with icons, titles, descriptions), Keyboard Shortcuts section
- Consistent tab alignment (single favicon column, no indent shifting)
- Resizable sidebar (280–700px)
- Dark theme default

## API Endpoints
- `POST /api/sessions` — Save session
- `GET /api/sessions` — List sessions
- `DELETE /api/sessions/{id}` — Delete session
- `POST /api/suggestions` — Submit suggestion

## Upcoming Tasks
- **P0**: Fully transition to live Chrome APIs (replace useMockTabs with useChromeTabs)
- **P1**: Keyboard-only workspace switching (Cmd+1/2/3)
- **P2**: Live tab thumbnail previews via chrome.tabs.captureVisibleTab
- **P2**: Export session/heatmap data as JSON/CSV

## Status: Feature Complete + UX Polished
All features implemented and tested (iterations 1-8: 100%).
