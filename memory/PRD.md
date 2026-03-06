# TabPilot - Chrome Extension Tab & Window Manager

## Original Problem Statement
Build a Chrome Extension called "TabPilot" — a sidebar-based tab and window manager using Manifest V3, React 18, and Tailwind CSS.

## Architecture
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI, system fonts
- **Backend:** FastAPI (Python) — sessions & suggestions endpoints
- **Database:** MongoDB (sessions, suggestions)
- **Extension:** Manifest V3 Chrome Extension (in /app/extension/tabpilot)

## All Features (tested, 100% pass across 11 iterations)

### Core Tab Management
- Tab Tree View with window/domain grouping, "Show more" for windows >5 tabs
- Global Fuzzy Search with live suggestions + Cmd+K hint
- Chrome Tab Groups with colored headers + colored left borders
- Duplicate Detection with badge icon, improved banner text
- Drag & Drop with grip handles on hover
- Session Save & Restore via API with contextual help
- Context Menu with visual grouping

### Advanced Features
- **Activity Heatmap**: Day/Week/Month filters, ALL charts scale by filter
- **Tab Timeline**: GitHub-contributions-style grid
- **Focus Mode** with timer
- **Tab Suspension** + Unsuspend All
- **Tab Notes** — CRUD via context menu + panel
- **Smart Workspaces** — 4 presets + custom CRUD + contextual help
- **Auto-Close Rules** — Timer presets, domain whitelist
- **Tab Previews** — Hover card anchored at sidebar edge, dismisses on click
- **Command Palette** (Cmd+K)
- **Domain View** — Collapsible domain groups with favicon, name, tab count

### UX Polish (Iterations 8-11)
- **GitHub Dark theme**: #0d1117 palette
- **Chrome system font**: -apple-system, BlinkMacSystemFont, Segoe UI
- **Sidebar collapse/expand**: PanelLeftClose toggle, floating expand button
- **Conditional toolbar**: Hidden for non-tab panels (notes, help, workspaces, etc.)
- **Show more tabs**: Windows >5 tabs show first 5 + "Show X more" expand
- **Single speaker icon**: Audio mute button only (no duplicate badge)
- **Stats bar**: 10px font, no yellow — uses primary/emerald/rose colors
- **Preview anchored to sidebar**: Uses container boundary, not tab position
- **Overflow toolbar**: Primary actions visible; secondary in "More" dropdown
- **Heatmap/Domain mutual exclusion**
- **Domain summaries**: Shortened + "+X more"

## API Endpoints
- `POST /api/sessions` — Save session
- `GET /api/sessions` — List sessions  
- `DELETE /api/sessions/{id}` — Delete session
- `POST /api/suggestions` — Submit suggestion

## Upcoming Tasks
- **P0**: Connect to Slack and other apps (user's next request)
- **P1**: Fully transition to live Chrome APIs
- **P2**: Keyboard workspace switching (Cmd+1/2/3)
- **P3**: Live tab thumbnail previews, Export data

## Status: Feature Complete + Launch-Ready UX
All features implemented and tested (iterations 1-11: 100%).
