# TabPilot - Chrome Tab & Window Manager Extension

## Original Problem Statement
Build a Chrome Extension called "TabPilot" - a sidebar-based tab and window manager.

## What's Been Implemented (2026-03-06)
### Iteration 1 - MVP: All 11 core features
### Iteration 2 - UI overhaul, sidebar to left, memory/CPU stats, heatmap
### Iteration 3 - Major polish & new features:
- GitHub-dark theme (#0d1117 family) as default
- Chrome system font (-apple-system, Segoe UI, system-ui)
- Window dividers replaced with spacing (no ugly lines)
- Tab alignment fixed (consistent px-3 padding, proper pl-4/pl-5 group indentation)
- Heatmap: SVG line chart (weekly activity) + bar chart (visits by domain) + clear "312 visits" labels + legend
- Focus Mode: Distraction-free view with timer + top 5 workflow tabs
- Tab Suspension: Suspend inactive tabs to save memory, suspended tabs appear dimmed with "(suspended)"
- Quick actions expanded with Pause (suspend) and Focus buttons

## Prioritized Backlog
### P1
- [ ] Package extension as downloadable ZIP
- [ ] Persist visit/suspension data across reloads
- [ ] Tab suspension memory savings display

### P2
- [ ] Chrome Web Store listing
- [ ] Multi-device session sync
- [ ] Tab analytics dashboard over time
