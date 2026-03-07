# TabPilot

**A powerful tab and window manager for Chrome — built as a sidebar extension.**

TabPilot gives you full control over every open tab and window from a sleek sidebar panel. Search, organize, suspend, focus, and automate — all without leaving your browser.

- **Manifest V3** · **Chrome Side Panel API** · **React 18** · **100% Private** (no data ever leaves your machine)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Architecture](#architecture)
- [Development](#development)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Privacy](#privacy)

---

## Features

### Tab Tree View
See all your windows and tabs in a collapsible tree. Tabs are organized by window, with Chrome tab groups shown with matching colored borders. Collapse or expand any window or group. Each window shows a summary of its most-visited domains.

### Fuzzy Search
Find any tab instantly by typing in the search bar. Matches against both title and URL with highlighted results. Suggestions appear as you type for quick switching.

### Command Palette (`Cmd+K`)
Spotlight-style quick switcher. Press `Cmd+K` (or `Ctrl+K`) to open, type to filter, arrow keys to navigate, Enter to switch. The fastest way to get to any tab.

### Sites View (Domain Grouping)
Toggle between window-based and domain-based views. Sites view groups all tabs by their domain (e.g., all GitHub tabs together, all Google Docs tabs together) with favicons and tab counts.

### Multi-Select & Bulk Close
Click the **Select** button in the toolbar to enter selection mode. Checkboxes appear on every tab. Select individual tabs, select all in a window, or select all. Then bulk-close them in one click. A floating action bar shows the count and provides Select All / Clear / Close actions.

### Focus Mode
Pick the tabs you want to concentrate on, then start a focus session. All other tabs are hidden (collapsed into a Chrome tab group). A timer tracks your focus duration. Focus state persists across panel reloads and syncs across all windows — if you exit focus in one window, it exits everywhere.

### Smart Workspaces
Save collections of tabs as named workspaces. Create workspaces like "Dev", "Research", or "Media" with custom icons (16 options) and colors. Activate a workspace to show only its tabs — everything else is hidden. Workspace state syncs across windows via `chrome.storage`. Duplicate workspace names are prevented.

### Session Manager
Snapshot your entire browser state (all windows and tabs) with a name. Restore any saved session later to reopen everything exactly as it was. View the tab list inside any session before restoring. Duplicate session names are prevented.

### Tab Suspension
Suspend inactive tabs to free up memory. Suspended tabs remain in the sidebar but are visually dimmed. Suspend all inactive tabs at once, or suspend/unsuspend individual tabs via right-click. The stats bar shows the current suspended count.

### Auto-Close Rules
Set time-based rules to automatically close idle tabs. Choose from presets (15min, 30min, 1hr, 2hr) or set a custom timer. Whitelist specific domains (e.g., `mail.google.com`) to keep them safe — subdomain-aware matching means whitelisting `google.com` also protects `docs.google.com`. The at-risk tab preview shows which tabs will be closed and how much time they have left. Tabs are **actually auto-closed** when their inactivity timer expires, with a toast notification for each closed tab. Tab activity is tracked in real time — switching to a tab immediately removes it from the at-risk list.

### Duplicate Detection
Duplicates are automatically detected and highlighted with a badge. The stats bar shows the duplicate count. The duplicate panel at the bottom lists all duplicates grouped by URL, with one-click "Close All Duplicates". Detection includes `chrome://` and `chrome-extension://` pages (new tab, settings, etc.).

### Tab Notes
Right-click any tab to attach a note. Notes persist across sessions via `chrome.storage` and show as a small badge on the tab. A dedicated Notes panel lists all annotated tabs for quick reference.

### Activity Heatmap
Visualize your browsing patterns with an interactive heatmap. View activity across Today, This Week, or This Month. The heatmap shows tab activity by time-of-day using color intensity. Includes a top-sites breakdown showing your most-visited domains.

### Tab Timeline
A 7-day browsing activity grid (GitHub contributions-style). Each cell represents one hour, colored by activity intensity. Click any cell to see active minutes, intensity percentage, and top domains for that hour. Includes a "NOW" indicator, daily breakdown bars, and a color legend. Live data from `chrome.history`.

### Chrome Profile Switching
Switch between Chrome profiles directly from the sidebar. Requires a one-time native messaging host setup (lightweight Python script). Features:
- **Profile list** with avatars, names, and email addresses
- **One-click switch** to any profile (opens that profile's Chrome window)
- **Sync Profiles** button to pick up newly created profiles
- **Remove profiles** from TabPilot (per-profile, without affecting Chrome)
- **Identity selection** — each Chrome profile identifies itself via user selection, cached per-profile in `chrome.storage.local`
- **Setup wizard** with copy-paste Terminal commands and safety notice

### Drag & Drop
Reorder tabs within a window by dragging. Drag tabs between windows to move them. A drop indicator shows exactly where the tab will land. Pinned tabs cannot be dragged (a toast explains why).

### Window Management
- **Rename windows** by double-clicking the window name (duplicate names prevented)
- **Close windows** with confirmation dialog
- **Minimize/restore windows** from the window menu
- **Create new tabs** in any window from the window menu
- Side panel **auto-opens in new windows**

### Cross-Window Sync
All state syncs across windows in real time:
- **Theme** — change dark/light mode in one window, all windows update
- **Focus mode** — start/exit focus in one window, all windows follow
- **Active workspace** — activate/deactivate syncs everywhere
- **Settings** — any preference change propagates immediately

### Notifications
Toast notifications for all actions (close, duplicate, suspend, mute, etc.) with opaque styling. All notifications auto-dismiss within 2 seconds. Undo support on tab close.

### Stats Bar & Profile Switcher
A persistent footer combining live metrics and profile switching:
- **Tabs** — total open tab count
- **Audio** — tabs currently playing audio
- **Paused** — suspended tab count
- **Dupes** — duplicate tab count
- **Profile dropdown** — quick switch profiles, manage profiles, re-identify

### Settings Panel
- **Show favicons** — toggle tab favicons on/off
- **Show URLs** — display URLs under tab titles
- **Compact mode** — tighter spacing for more tabs on screen
- **Confirm actions** — require confirmation before destructive actions
- **Theme** — Light / Dark / System

### Help Panel
Categorized feature guide organized into "Find & Navigate", "Organize & Focus", and "Save & Automate" sections. Includes keyboard shortcuts reference and a feedback button.

### First-Time Tour
A guided tour highlights key features when you first install TabPilot.

---

## Installation

### From Source (Developer)

1. Clone the repository:
   ```bash
   git clone https://github.com/chethan-sudo/chrome-pilot.git
   cd chrome-pilot
   ```

2. Build the frontend:
   ```bash
   cd frontend
   npm install
   npx craco build
   ```

3. Deploy to extension:
   ```bash
   # From repo root
   rm -rf extension/tabpilot/sidepanel/static
   cp -r frontend/build/static extension/tabpilot/sidepanel/static
   # Update sidepanel/index.html with new bundle hashes if needed
   ```

4. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `extension/tabpilot` folder

5. Click the TabPilot icon in the toolbar (or press `Cmd+Shift+E`) to open the sidebar.

6. **(Optional) Set up profile switching:**
   ```bash
   cd native-host
   bash install.sh
   # Paste your extension ID when prompted (find it at chrome://extensions)
   ```
   Then restart Chrome. The Profiles panel will now show your Chrome profiles.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+E` | Toggle TabPilot sidebar |
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `↑` `↓` | Navigate through tabs |
| `Enter` | Switch to selected tab |
| `Delete` / `Backspace` | Close selected tab |
| Right-click | Context menu (pin, mute, move, copy URL, add note) |

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Chrome Side Panel (sidepanel/index.html) │
│  ┌───────────────────────────────────┐  │
│  │         React Application          │  │
│  │  ┌─────────┐  ┌────────────────┐  │  │
│  │  │ Sidebar  │  │  Feature Panels │  │  │
│  │  │ (main)   │  │  (sessions,    │  │  │
│  │  │          │  │   workspaces,  │  │  │
│  │  │          │  │   focus, etc.) │  │  │
│  │  └─────────┘  └────────────────┘  │  │
│  └───────────────────────────────────┘  │
│                    │                      │
│          ┌─────────┴──────────┐          │
│          │  chromeAdapter.js   │          │
│          │  (Chrome API layer) │          │
│          └─────────┬──────────┘          │
│                    │                      │
│     ┌──────────────┼──────────────┐      │
│     │              │              │      │
│  chrome.tabs  chrome.windows  chrome.    │
│              chrome.tabGroups  storage   │
└─────────────────────────────────────────┘

┌──────────────────┐
│  background.js    │  ← Service worker: auto-opens
│  (MV3 SW)        │     side panel, listens for
│                  │     tab/window events
└──────────────────┘
```

### Key Design Decisions

- **Display-layer filtering**: Hidden tabs (from focus mode / workspaces) are filtered at the UI display layer, not the data layer. This keeps `tabs.allTabs` complete for operations like workspace activation and session saving.
- **chrome.storage for cross-window state**: Focus mode, active workspace, theme, and settings all persist to `chrome.storage.local` with `onChanged` listeners for real-time sync.
- **Per-window tab grouping**: `chrome.tabs.group` only works within a single window, so hiding tabs groups them per-window separately.
- **Adaptive hooks**: Both `useMockTabs` and `useChromeTabs` are always called (React rules of hooks). The adapter selects based on runtime context — extension uses real Chrome APIs, web preview uses mock data.

---

## Development

### Web Preview (no extension needed)

```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:3000` with mock tab data for development.

### Build for Extension

```bash
cd frontend
npx craco build
```

Then copy `build/static/` to `extension/tabpilot/sidepanel/static/` and update the hashes in `sidepanel/index.html`.

### Build Script

```bash
# From repo root
./build-extension.sh
```

---

## Project Structure

```
chrome-pilot/
├── extension/tabpilot/          # Chrome extension (load this in chrome://extensions)
│   ├── manifest.json            # MV3 manifest
│   ├── background.js            # Service worker
│   ├── sidepanel/
│   │   ├── index.html           # Side panel entry point
│   │   └── static/              # Built React app (JS/CSS bundles)
│   └── icons/                   # Extension icons
│
├── frontend/                    # React source code
│   ├── src/
│   │   ├── components/tabpilot/ # All UI components
│   │   │   ├── Sidebar.jsx      # Main container — state management, filtering, routing
│   │   │   ├── WindowGroup.jsx  # Window tree with tabs, drag-drop, rename
│   │   │   ├── TabItem.jsx      # Individual tab row with context menu
│   │   │   ├── DomainView.jsx   # Domain-grouped tab view
│   │   │   ├── FocusMode.jsx    # Focus mode with tab selection + timer
│   │   │   ├── WorkspaceManager.jsx  # Workspace CRUD + activation
│   │   │   ├── SessionManager.jsx    # Session save/restore/delete
│   │   │   ├── AutoClosePanel.jsx    # Auto-close rules + at-risk preview
│   │   │   ├── HeatmapPanel.jsx      # Activity heatmap visualization
│   │   │   ├── SearchBar.jsx         # Fuzzy search with suggestions
│   │   │   ├── CommandPalette.jsx    # Cmd+K quick switcher
│   │   │   ├── QuickActions.jsx      # Toolbar action buttons
│   │   │   ├── DuplicatePanel.jsx    # Duplicate tab detection + close
│   │   │   ├── StatsBar.jsx          # Footer stats (tabs, audio, paused, dupes)
│   │   │   ├── HelpPanel.jsx         # Categorized help guide
│   │   │   ├── SettingsPanel.jsx     # User preferences
│   │   │   ├── TabNotesPanel.jsx     # Notes management
│   │   │   ├── TabTimeline.jsx       # 7-day activity grid
│   │   │   ├── ProfilePanel.jsx     # Profile management panel
│   │   │   ├── ProfileSwitcher.jsx  # Bottom bar stats + profile dropdown
│   │   │   ├── TabPreview.jsx        # Tab hover preview
│   │   │   ├── TourGuide.jsx         # First-time onboarding
│   │   │   └── TabGroupHeader.jsx    # Chrome tab group header
│   │   │
│   │   ├── hooks/
│   │   │   ├── useChromeTabs.js      # Real Chrome tabs/windows/groups API
│   │   │   ├── useMockTabs.js        # Mock data for web preview
│   │   │   ├── useSearch.js          # Fuzzy search logic
│   │   │   ├── useSessions.js        # Session persistence
│   │   │   ├── useSettings.js        # Settings with chrome.storage sync
│   │   │   └── useHistoryData.js     # Heatmap data from chrome.history
│   │   │
│   │   ├── utils/
│   │   │   ├── chromeAdapter.js      # Chrome API wrappers (tabs, windows, storage)
│   │   │   ├── grouping.js           # Domain grouping, favicon, URL normalization
│   │   │   └── mockData.js           # Mock tab/window data
│   │   │
│   │   ├── pages/
│   │   │   └── TabPilotPreview.jsx   # Web preview with landing page
│   │   │
│   │   └── components/ui/           # shadcn/ui components
│   │
│   ├── craco.config.js              # CRA override config
│   ├── tailwind.config.js           # Tailwind + custom theme
│   └── package.json
│
├── native-host/                 # Native messaging host for profile switching
│   ├── tabpilot_profiles.py     # Python script (reads profiles, launches Chrome)
│   ├── install.sh               # One-time macOS install script
│   └── com.tabpilot.profiles.json  # Native messaging manifest template
│
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 |
| Build Tool | Create React App + craco |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Icons | Lucide React |
| Toasts | Sonner |
| Extension | Chrome Manifest V3, Side Panel API |
| State Sync | chrome.storage.local + onChanged listeners |
| Fonts | Manrope (body), JetBrains Mono (monospace) |

---

## Chrome Permissions

| Permission | Purpose |
|-----------|---------|
| `tabs` | Read/modify tabs (title, URL, pin, mute, move, close) |
| `tabGroups` | Create/collapse groups for focus mode and workspaces |
| `windows` | Read window state, create/close/minimize windows |
| `sidePanel` | Render the sidebar UI |
| `storage` | Persist settings, notes, workspaces, focus state |
| `sessions` | Undo close tab (restore recently closed) |
| `history` | Activity heatmap data |
| `activeTab` | Access current tab info |
| `nativeMessaging` | Communicate with native host for Chrome profile switching |

---

## Privacy

TabPilot runs **entirely in your browser**. Zero data is collected, transmitted, or stored externally. All data (settings, notes, sessions, workspaces) lives in `chrome.storage.local` on your machine. No analytics. No tracking. No network requests.
