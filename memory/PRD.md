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

### Resizable Sidebar (Mar 2026)
- Drag handle on right edge of extension sidebar (280px–720px range)
- Double-click handle resets to 400px default
- Width persisted via `chrome.storage.local` — survives browser restarts
- Extension now shows **sidebar only** (no homepage) — `isExtensionContext()` guard in `TabPilotPreview.jsx`
- Tab "show more" threshold raised from 5 → 15 (practical for real Chrome tabs)
- Extension rebuilt with new JS/CSS: `main.f1038638.js` / `main.0d247cfd.css`
- **Search bar character input**: `pr-16` (64px) reduced to `pr-7` — now shows full text input
- **Search bar visibility**: Fixed dark-only transparent bg to use `bg-input/60 border border-border/60`
- **TabPilot text color**: Split "Tab"=foreground + "Pilot"=primary in sidebar — matches homepage
- **Note shown twice**: Hover note button hidden when note badge is already showing
- **Mute/unmute icon bug**: `wasAudible` stored in mutedInfo; restored on unmute
- **DomainView cursor**: Added `cursor-pointer` to domain tab close button
- **New tab position**: Now prepends to top of tab list instead of bottom
- **Toast duration**: All notifications capped at 3s (Toaster default + explicit fixes)
- **Stats strip**: "Accounts needed" → "Data collected"
- **Tour**: Removed emojis/icons from all steps; heading increased to 18px

## Chrome Extension — Ready to Install

### Extension Files
Location: `/app/extension/tabpilot/`

### How to Install
1. Download/export `/app/extension/tabpilot/` folder
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `tabpilot` folder
5. Press `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`) to open the sidebar

### How to Rebuild After Changes
```bash
cd /app && bash build-extension.sh
```

### Technical Architecture
- **Web preview** (`REACT_APP_BACKEND_URL`): Uses `useMockTabs.js` for demo data
- **Extension context** (Chrome): Uses `useChromeTabs.js` with real Chrome APIs
- Detection: `isExtensionContext()` in `chromeAdapter.js` — both hooks always called, correct one returned

### Permissions Used
- `tabs`, `windows`, `tabGroups` — read and manage browser tabs/windows
- `storage` — persist tab notes and window names
- `sessions` — undo closed tabs (`chrome.sessions.restore`)
- `sidePanel` — show sidebar
- `activeTab` — read current tab

### Key Chrome API Features
- Real-time tab sync (2s polling + event listeners)
- Tab notes persisted in `chrome.storage.local`
- Window rename stored in `chrome.storage.local`
- Undo close via `chrome.sessions.getRecentlyClosed`
All features implemented and tested (iterations 1-11: 100%). Latest bug fixes applied Feb 2026.
