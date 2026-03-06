# TabPilot - Chrome Extension Tab & Window Manager

## Original Problem Statement
Build a Chrome Extension called "TabPilot" — a sidebar-based tab and window manager using Manifest V3, React 18, and Tailwind CSS.

## Architecture
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI, system fonts
- **Backend:** FastAPI (Python) — sessions & suggestions endpoints
- **Database:** MongoDB (sessions, suggestions)
- **Extension:** Manifest V3 Chrome Extension (in /app/extension/tabpilot)

## All Features (tested, 100% pass across 13 iterations)

### Core Tab Management
- Tab Tree View with window/domain grouping, "Show more" for windows >5 tabs
- Global Fuzzy Search with live suggestions + Cmd+K hint
- Chrome Tab Groups with colored headers + colored left borders
- Duplicate Detection with badge icon, Fix All banner (always visible at any sidebar width)
- Drag & Drop with grip handles on hover
- Session Save & Restore via API with contextual help
- Context Menu with visual grouping

### Advanced Features
- **Activity Heatmap**: Day/Week/Month filters, ALL charts scale by filter
- **Tab Timeline**: GitHub-contributions-style grid, date format "Day, Mon DD · HH:MM AM/PM"
- **Focus Mode** with timer
- **Tab Suspension** + Unsuspend All
- **Tab Notes** — CRUD via context menu + panel
- **Smart Workspaces** — 4 presets + custom CRUD, Activate/Deactivate toggle per workspace
- **Auto-Close Rules** — Timer presets, domain whitelist with favicons
- **Tab Previews** — Hover card anchored at sidebar edge, dismisses on click
- **Command Palette** (Cmd+K)
- **Domain View** — Collapsible domain groups with favicon, name, tab count

### UX Polish & New Features (Iterations 8-14)
- **First-time onboarding tour**: Spotlight-based 6-step tour, progress bar, skip/next/back; stored in localStorage
- **Permission confirmation**: Settings toggle "Ask before tab/window actions"; dialog appears before create/close
- **Window + button**: Hover header to see "+", creates new tab in that specific window
- **Window rename**: Double-click window name → inline edit → Enter saves / Escape cancels
- **Cursor fix**: cursor-default on tab items; cursor-pointer only on close/action buttons
- **Resize handle 3s flash**: Shows on page load for 3s, then hides; always responds to hover
- **Copy install link**: Homepage hero has "Add to Chrome" + "Copy install link" with toast feedback
- **Enhanced tab preview**: Mock browser chrome (window dots, URL bar, favicon, content lines)
- **Duplicate tab fix**: Right-click duplicate auto-expands tab list, shows toast confirmation
- **Workspace keyboard shortcuts**: Ctrl/Cmd + 1/2/3/4 switches workspace with toast notification
- **GitHub Dark theme**: #0d1117 palette
- **Chrome system font**: -apple-system, BlinkMacSystemFont, Segoe UI
- **Sidebar collapse/expand**: Collapse button in header row (no overlap), floating expand button, min 320px
- **Conditional toolbar**: Hidden for non-tab panels (notes, help, workspaces, etc.)
- **Show more tabs**: Windows >5 tabs show first 5 + "Show X more" expand
- **Single speaker icon**: Audio mute button only (no duplicate badge)
- **Stats bar**: No tooltips, no yellow — uses primary/emerald/rose colors
- **Preview anchored to sidebar**: Uses container boundary, not tab position
- **Overflow toolbar**: Primary actions visible; secondary in "More" dropdown (icon-only More button)
- **Heatmap/Domain mutual exclusion**
- **Domain mode clarity**: Button label changes Domain↔Windows, Window button hidden in domain mode
- **No yellow/amber text**: Duplicate color is red (#ef4444)
- **Whitelisted domains**: Show website favicon in Auto-Close panel
- **Help panel**: Pill-style tab switcher, left-border tips, clean keyboard shortcuts
- **Workspace Activate/Deactivate**: Active workspace shows Deactivate button
- **Timeline date format**: "Sat, Feb 28 · 6:00 AM" — clear and readable
- **Tab highlighting**: ONLY focused window's active tab highlighted; non-focused windows' active tabs transparent
- **Group text labels**: text-foreground/65 for readable group names (Work/Media/Shopping)
- **TabPilot text**: text-[13px] for better visibility
- **Collapse icon**: Consistent opacity with other header icons
- **Homepage vs sidebar color**: bg-card on homepage, bg-background on sidebar — visual separation
- **Scrollbar fix (CRITICAL)**: pr-3 content wrapper + Radix CSS override prevents text from crossing scrollbar

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

### Bug Fixes (Feb 2026)
- **Search bar visibility**: Fixed `bg-white/[0.04]` dark-only styling → now uses `bg-input/60 border border-border/60` (works in both light & dark themes)
- **TabPilot text color**: Changed from `text-primary` (blue) to `text-foreground` (dark in light mode, light in dark mode)
- **Note shown twice**: Hover note button is now hidden when a note badge is already showing (`!hasNote` condition)
- **Mute/unmute icon bug**: Fixed `muteTab` to store `wasAudible` in `mutedInfo` when muting; restores original audible state on unmute so icon persists correctly

## Status: Feature Complete + Launch-Ready UX
All features implemented and tested (iterations 1-11: 100%). Latest bug fixes applied Feb 2026.
