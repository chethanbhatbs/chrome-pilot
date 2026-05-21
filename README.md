<h1 align="center">ChromePilot</h1>

<p align="center">
  A tab & window manager for Chrome — sidebar, search, focus mode, workspaces.<br>
  <sub>Manifest V3 · React 18 · 100% local — nothing leaves your browser.</sub>
</p>

<p align="center">
  <a href="https://github.com/chethanbhatbs/chrome-pilot/releases/latest/download/chrome-pilot.zip">
    <img src="https://img.shields.io/badge/⬇_Download_ZIP-2ea44f?style=for-the-badge" alt="Download ZIP" />
  </a>
</p>

<p align="center">
  <img src="docs/screenshots/hero.gif" alt="ChromePilot demo" width="720" />
</p>

---

## Install (no terminal needed)

1. **[Download the ZIP](https://github.com/chethanbhatbs/chrome-pilot/releases/latest/download/chrome-pilot.zip)** and unzip it anywhere.
2. Open Chrome → `chrome://extensions`
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked** → select the unzipped **`tabpilot`** folder.
5. Press **`Cmd+Shift+E`** (Mac) or **`Ctrl+Shift+E`** (Win/Linux) to open the sidebar.

Done. The extension stays installed across Chrome restarts.

---

## What it does

- **Tab tree** — every window and tab in a collapsible sidebar, grouped by Chrome tab groups
- **Fuzzy search** + **`Cmd+K` command palette** for instant tab switching
- **Sites view** — group all tabs by domain
- **Focus Mode** — pick tabs to focus on; everything else is hidden, new tabs/windows blocked
- **Workspaces** — save tab collections as named workspaces with icons & colors
- **Sessions** — snapshot the whole browser state, restore later
- **Tab suspension** to free memory · **auto-close rules** for idle tabs · **duplicate detection**
- **Tab notes**, **activity heatmap**, **7-day timeline**, **drag & drop**, **Chrome profile switching**

---

## Screenshots

<table>
<tr>
<td width="50%"><img src="docs/screenshots/sidebar.png" alt="Sidebar tab tree" /><br><sub align="center">Sidebar — tab tree grouped by window</sub></td>
<td width="50%"><img src="docs/screenshots/command-palette.png" alt="Command palette" /><br><sub align="center">Cmd+K command palette</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/focus-mode.png" alt="Focus mode" /><br><sub align="center">Focus mode — blocked-action overlay</sub></td>
<td width="50%"><img src="docs/screenshots/workspaces.png" alt="Workspaces" /><br><sub align="center">Workspaces with custom icons & colors</sub></td>
</tr>
</table>

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+Shift+E` / `Ctrl+Shift+E` | Toggle sidebar |
| `Cmd+K` / `Ctrl+K` | Command palette |
| `↑` `↓` | Navigate tabs |
| `Enter` | Switch to tab |
| `Delete` / `Backspace` | Close tab |
| Right-click | Pin, mute, move, copy URL, add note |

---

## Privacy

100% local. No analytics, no telemetry, no external servers. Tab data lives in `chrome.storage` on your machine.

---

<details>
<summary><b>Build from source</b> (only needed to modify the React frontend)</summary>

```bash
git clone https://github.com/chethanbhatbs/chrome-pilot.git
cd chrome-pilot/frontend
npm install --legacy-peer-deps
cd ..
bash build-extension.sh
```

The built extension lands in `extension/tabpilot/`. Load it via `chrome://extensions` → **Load unpacked**.

**Optional — profile switching native host:**
```bash
cd native-host
bash install.sh    # paste your extension ID when prompted
```
Then restart Chrome.

</details>

<details>
<summary><b>Architecture</b></summary>

- **Side panel UI** (`extension/tabpilot/sidepanel/`) — React app rendered in Chrome's Side Panel API
- **Service worker** (`background.js`) — enforces Focus Mode, listens for tab/window events, injects page-level notifications
- **Content scripts** (`content.js`, `content-focus.js`) — page-level overlays for focus restrictions
- **Native host** (`native-host/`) — optional Python script for Chrome profile switching via `chrome.runtime.connectNative`

Key design decisions:
- Hidden tabs are filtered at the UI display layer, not the data layer — keeps `tabs.allTabs` complete for workspace activation and session saving
- Cross-window state (focus mode, active workspace, theme, settings) syncs via `chrome.storage.local` + `onChanged` listeners
- Focus Mode is enforced in the service worker, not just the UI, so restrictions hold even when the sidebar is closed
- Favicons route to Google S2 for public domains and Chrome's native favicon for internal/private domains

</details>

---

<p align="center">
  <sub>Built with <a href="https://emergent.sh">Emergent</a> + <a href="https://claude.ai/code">Claude Code</a> · refined by hand</sub>
</p>
