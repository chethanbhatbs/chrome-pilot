# TabPilot - Chrome Extension Tab & Window Manager

## Original Problem Statement
Build a Chrome Extension called "TabPilot" — a sidebar-based tab and window manager using Manifest V3, React 18, and Tailwind CSS.

## Architecture
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI, custom hooks
- **Backend:** FastAPI (Python) — sessions & suggestions endpoints
- **Database:** MongoDB (sessions, suggestions)
- **Extension:** Manifest V3 Chrome Extension (in /app/extension/tabpilot)
- **Dev strategy:** Web preview with mock data for rapid iteration

## All Features Implemented (all tested, 100% pass)

### Core
- Real-Time Tab Tree View with window/domain grouping
- Global Fuzzy Search with live suggestions dropdown + Cmd+K hint in placeholder
- Chrome Tab Groups with colored headers + colored left borders on grouped tabs
- Duplicate Tab Detection with inline ring indicators + descriptive "Fix All" banner
- Drag & Drop with visible grip handles on hover
- Session Save & Restore via API
- Context Menu with visual grouping (navigation, state, organization, destructive)

### Advanced
- Activity Heatmap: Day/Week/Month/Custom filters, time in hours + visit counts
- Tab Timeline: GitHub-contributions-style grid (7 days x 18 hours) with click detail
- Focus Mode with timer
- Tab Suspension (suspend/unsuspend/unsuspend all)
- Tab Notes with CRUD via context menu + dedicated panel
- Smart Workspaces (4 presets: Deep Work, Meetings, Research, Break Time)
- Command Palette (Cmd+K spotlight-style quick switch)
- Help panel with tips, keyboard shortcuts, suggestion form, privacy disclaimer

### UX Polish
- Toolbar icons with text labels + logical grouping with dividers
- Higher contrast header icons
- Tab state badges: pin icon, note icon, duplicate ring, suspended opacity
- Window headers with domain summaries and bigger chevrons
- Labeled status bar: "Tabs: 14 | Mem: 2.5G | CPU: 4.5% | Audio: 2 | Dupes: 1"
- Resizable sidebar with subtle drag handle (280px-700px)
- Dark theme (default), mute on hover for all tabs

## API Endpoints
- `POST /api/sessions` — Save a session
- `GET /api/sessions` — List sessions
- `DELETE /api/sessions/{id}` — Delete a session
- `POST /api/suggestions` — Submit user suggestion

## Status: Feature Complete
All user-requested features implemented and tested (iterations 1-6: 100%).
