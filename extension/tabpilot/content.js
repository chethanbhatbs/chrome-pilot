/**
 * ChromePilot Content Script
 * Left-sidebar injection with resizable handle + persistent width.
 */

const SIDEBAR_ID = '__tabpilot_root__';
const IFRAME_ID  = '__tabpilot_iframe__';
const HANDLE_ID  = '__tabpilot_resize__';
const MIN_W = 280;
const MAX_W = 720;
const DEFAULT_W = 400;
const COMMAND_CENTER_ID = '__tabpilot_command_center__';

let isVisible    = false;
let sidebarWidth = DEFAULT_W;
let commandCenter = null;
let commandCenterState = null;
let commandCenterQuery = '';
let commandCenterSelectedIndex = 0;

// ── Load persisted state (width + open/closed) ───────────────────────────────
chrome.storage.local.get(['tabpilotWidth', 'tabpilotOpen'], (data) => {
  if (data.tabpilotWidth) sidebarWidth = data.tabpilotWidth;
  // Restore sidebar open state when user navigates to a new page
  if (data.tabpilotOpen) showSidebar();
});

// ── Apply width (sidebar + body margin) ──────────────────────────────────────
function applyWidth(w) {
  const el = document.getElementById(SIDEBAR_ID);
  if (!el) return;
  el.style.setProperty('width', `${w}px`, 'important');
  // When hidden, keep transform in sync so slide-in starts from the right edge
  if (!isVisible) {
    el.style.setProperty('transform', `translateX(-${w}px)`, 'important');
  }
  // CSS variable drives body margin
  document.documentElement.style.setProperty('--tabpilot-margin', `${w}px`);
}

// ── Resize handle logic ───────────────────────────────────────────────────────
function setupResizeHandle(handle) {
  let startX, startWidth;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startX     = e.clientX;
    startWidth = sidebarWidth;

    // Disable iframe pointer events so mousemove isn't swallowed during drag
    const iframe = document.getElementById(IFRAME_ID);
    if (iframe) iframe.style.setProperty('pointer-events', 'none', 'important');

    document.documentElement.style.setProperty('cursor', 'col-resize', 'important');
    document.body.style.setProperty('user-select', 'none', 'important');

    const onMove = (moveEvt) => {
      const delta = moveEvt.clientX - startX;
      const newW  = Math.min(Math.max(startWidth + delta, MIN_W), MAX_W);
      sidebarWidth = newW;
      applyWidth(newW);
    };

    const onUp = () => {
      // Restore iframe pointer events after drag ends
      const iframe = document.getElementById(IFRAME_ID);
      if (iframe) iframe.style.removeProperty('pointer-events');

      document.documentElement.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      chrome.storage.local.set({ tabpilotWidth: sidebarWidth });
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Double-click → reset to default width
  handle.addEventListener('dblclick', (e) => {
    e.preventDefault();
    sidebarWidth = DEFAULT_W;
    applyWidth(DEFAULT_W);
    chrome.storage.local.set({ tabpilotWidth: DEFAULT_W });
  });
}

// ── Build sidebar DOM ─────────────────────────────────────────────────────────
function buildSidebar() {
  if (document.getElementById(SIDEBAR_ID)) return;

  const root = document.createElement('div');
  root.id = SIDEBAR_ID;
  // Apply current width immediately (before CSS loads)
  root.style.setProperty('width', `${sidebarWidth}px`, 'important');
  root.style.setProperty('transform', `translateX(-${sidebarWidth}px)`, 'important');

  const iframe = document.createElement('iframe');
  iframe.id    = IFRAME_ID;
  iframe.src   = chrome.runtime.getURL('sidepanel/index.html');
  iframe.title = 'ChromePilot';
  iframe.allow = 'clipboard-read; clipboard-write';

  const handle = document.createElement('div');
  handle.id = HANDLE_ID;
  setupResizeHandle(handle);

  root.appendChild(iframe);
  root.appendChild(handle);
  document.documentElement.appendChild(root);
}

// ── Show / hide ───────────────────────────────────────────────────────────────
function showSidebar() {
  buildSidebar();
  const el = document.getElementById(SIDEBAR_ID);
  applyWidth(sidebarWidth);
  el.style.setProperty('transform', 'translateX(0)', 'important');
  document.documentElement.classList.add('tabpilot-active');
  isVisible = true;
  chrome.storage.local.set({ tabpilotOpen: true });
}

function hideSidebar() {
  const el = document.getElementById(SIDEBAR_ID);
  if (el) el.style.setProperty('transform', `translateX(-${sidebarWidth}px)`, 'important');
  document.documentElement.classList.remove('tabpilot-active');
  isVisible = false;
  chrome.storage.local.set({ tabpilotOpen: false });
}

function toggleSidebar() {
  if (isVisible) hideSidebar();
  else showSidebar();
}

function sendTabPilotCommand(action, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: true });
    });
  });
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function scoreItem(item, query) {
  if (!query) return item.kind === 'action' ? 20 : 10;
  const haystack = `${item.title} ${item.subtitle || ''} ${item.url || ''}`.toLowerCase();
  const needle = query.toLowerCase().trim();
  if (!needle) return 1;
  if (haystack.includes(needle)) return 100 - haystack.indexOf(needle);

  let score = 0;
  let cursor = 0;
  for (const char of needle) {
    const index = haystack.indexOf(char, cursor);
    if (index === -1) return 0;
    score += Math.max(1, 20 - (index - cursor));
    cursor = index + 1;
  }
  return score;
}

function buildCommandItems(state) {
  if (!state) return [];

  const duplicateTotal = state.tabs.filter((tab) => tab.duplicateCount > 1).length;
  const actionItems = [
    {
      kind: 'action',
      icon: '⌘',
      title: 'Open Tab Pilot sidebar',
      subtitle: 'Show the full window and tab cockpit',
      run: () => sendTabPilotCommand('tabpilot-command-open-sidepanel', {
        activeWindowId: state.activeWindowId,
      }),
    },
    {
      kind: 'action',
      icon: 'D',
      title: `Close duplicate tabs${duplicateTotal ? ` (${duplicateTotal})` : ''}`,
      subtitle: duplicateTotal ? 'Keep the first copy of each URL' : 'No duplicates detected right now',
      run: () => sendTabPilotCommand('tabpilot-command-close-duplicates'),
    },
    {
      kind: 'action',
      icon: 'F',
      title: 'Focus on this tab',
      subtitle: 'Lock browsing to the current tab until focus mode ends',
      run: () => sendTabPilotCommand('tabpilot-command-focus-tab', {
        tabId: state.activeTabId,
      }),
    },
    {
      kind: 'action',
      icon: 'W',
      title: 'Focus on this window',
      subtitle: 'Allow only the tabs in the current window',
      run: () => sendTabPilotCommand('tabpilot-command-focus-window', {
        windowId: state.activeWindowId,
      }),
    },
    {
      kind: 'action',
      icon: 'S',
      title: 'Save this window as a workspace',
      subtitle: 'Capture all current-window URLs for later restore',
      run: () => sendTabPilotCommand('tabpilot-command-save-workspace', {
        windowId: state.activeWindowId,
      }),
    },
    {
      kind: 'action',
      icon: 'R',
      title: 'Restore latest workspace',
      subtitle: state.workspaceCount ? `${state.workspaceCount} saved workspace${state.workspaceCount === 1 ? '' : 's'}` : 'No saved workspaces yet',
      run: () => sendTabPilotCommand('tabpilot-command-open-workspace'),
    },
  ];

  if (state.focusActive) {
    actionItems.unshift({
      kind: 'action',
      icon: 'X',
      title: 'Exit Focus Mode',
      subtitle: 'Return to normal browsing',
      run: () => sendTabPilotCommand('tabpilot-command-stop-focus'),
    });
  }

  const tabItems = state.tabs.map((tab) => ({
    kind: 'tab',
    icon: tab.pinned ? 'P' : tab.audible ? 'A' : 'T',
    title: tab.title,
    subtitle: `Window ${state.windows.findIndex((win) => win.id === tab.windowId) + 1 || '?'} · ${getDomain(tab.url) || 'local page'}`,
    url: tab.url,
    tab,
    run: () => sendTabPilotCommand('tabpilot-command-switch-tab', {
      tabId: tab.id,
      windowId: tab.windowId,
    }),
  }));

  return [...actionItems, ...tabItems];
}

function getFilteredCommandItems() {
  return buildCommandItems(commandCenterState)
    .map((item) => ({ item, score: scoreItem(item, commandCenterQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ item }) => item);
}

function showCommandToast(message) {
  if (!commandCenter) return;
  const toast = commandCenter.shadowRoot.querySelector('[data-role="toast"]');
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    if (toast.textContent === message) toast.hidden = true;
  }, 1800);
}

function renderCommandCenter() {
  if (!commandCenter) return;
  const root = commandCenter.shadowRoot;
  const input = root.querySelector('[data-role="input"]');
  const list = root.querySelector('[data-role="list"]');
  const meta = root.querySelector('[data-role="meta"]');
  const items = getFilteredCommandItems();

  commandCenterSelectedIndex = Math.min(commandCenterSelectedIndex, Math.max(items.length - 1, 0));
  input.value = commandCenterQuery;
  meta.textContent = commandCenterState
    ? `${commandCenterState.tabs.length} tabs · ${commandCenterState.windows.length} windows`
    : 'Loading Chrome state...';

  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No matching tabs or commands';
    list.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement('button');
    row.className = `row${index === commandCenterSelectedIndex ? ' selected' : ''}`;
    row.type = 'button';
    row.dataset.index = String(index);

    const icon = document.createElement('span');
    icon.className = `icon ${item.kind}`;
    icon.textContent = item.icon;

    const copy = document.createElement('span');
    copy.className = 'copy';

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = item.title;

    const subtitle = document.createElement('span');
    subtitle.className = 'subtitle';
    subtitle.textContent = item.subtitle || item.url || '';

    const type = document.createElement('span');
    type.className = 'type';
    type.textContent = item.kind === 'tab' ? 'Switch' : 'Run';

    copy.append(title, subtitle);
    row.append(icon, copy, type);
    row.addEventListener('mouseenter', () => {
      commandCenterSelectedIndex = index;
      renderCommandCenter();
    });
    row.addEventListener('click', () => runSelectedCommand());
    list.appendChild(row);
  });
}

async function refreshCommandCenterState() {
  const response = await sendTabPilotCommand('tabpilot-command-state');
  if (!response.ok) {
    showCommandToast(response.error || 'Could not read tabs');
    return;
  }
  commandCenterState = response.state;
  renderCommandCenter();
}

async function runSelectedCommand() {
  const items = getFilteredCommandItems();
  const selected = items[commandCenterSelectedIndex];
  if (!selected) return;

  const response = await selected.run();
  if (!response?.ok) {
    showCommandToast(response?.error || 'Command failed');
    return;
  }

  if (selected.kind === 'tab') {
    closeCommandCenter();
    return;
  }

  const messages = {
    'Close duplicate tabs': `${response.closedCount || 0} duplicate tab${response.closedCount === 1 ? '' : 's'} closed`,
    'Focus on this tab': 'Focus Mode started for this tab',
    'Focus on this window': `${response.focusCount || 0} tab${response.focusCount === 1 ? '' : 's'} added to Focus Mode`,
    'Exit Focus Mode': 'Focus Mode ended',
    'Save this window as a workspace': response.workspace ? 'Workspace saved' : 'No URLs to save',
    'Restore latest workspace': response.workspace ? 'Workspace restored in a new window' : 'No saved workspace yet',
    'Open Tab Pilot sidebar': 'Sidebar opened',
  };
  const label = Object.keys(messages).find((key) => selected.title.startsWith(key));
  showCommandToast(messages[label] || 'Done');
  await refreshCommandCenterState();
}

function ensureCommandCenter() {
  if (commandCenter) return commandCenter;

  commandCenter = document.createElement('div');
  commandCenter.id = COMMAND_CENTER_ID;
  const shadow = commandCenter.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: none;
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #f8fafc;
      }
      :host(.open) { display: block; }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(2, 6, 23, 0.52);
        backdrop-filter: blur(10px);
      }
      .panel {
        position: absolute;
        top: min(11vh, 88px);
        left: 50%;
        width: min(720px, calc(100vw - 28px));
        transform: translateX(-50%);
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 8px;
        background: #0f172a;
        box-shadow: 0 24px 80px rgba(2, 6, 23, 0.48);
      }
      .search {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      }
      input {
        all: unset;
        min-width: 0;
        color: #f8fafc;
        font-size: 15px;
        line-height: 24px;
      }
      input::placeholder { color: #64748b; }
      .meta {
        color: #94a3b8;
        font-size: 11px;
        white-space: nowrap;
      }
      .list {
        max-height: min(62vh, 560px);
        overflow-y: auto;
        padding: 6px;
      }
      .row {
        all: unset;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: 32px 1fr auto;
        gap: 12px;
        align-items: center;
        width: 100%;
        min-height: 54px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
      }
      .row.selected {
        background: rgba(37, 99, 235, 0.18);
        outline: 1px solid rgba(96, 165, 250, 0.22);
      }
      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 7px;
        background: rgba(148, 163, 184, 0.12);
        color: #cbd5e1;
        font-size: 12px;
        font-weight: 700;
      }
      .icon.action {
        background: rgba(37, 99, 235, 0.18);
        color: #93c5fd;
      }
      .copy {
        display: grid;
        min-width: 0;
        gap: 2px;
      }
      .title {
        overflow: hidden;
        color: #f8fafc;
        font-size: 13px;
        font-weight: 650;
        line-height: 18px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .subtitle {
        overflow: hidden;
        color: #94a3b8;
        font-size: 11px;
        line-height: 16px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .type {
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 12px;
        border-top: 1px solid rgba(148, 163, 184, 0.14);
        color: #64748b;
        font-size: 10px;
      }
      kbd {
        border: 1px solid rgba(148, 163, 184, 0.26);
        border-radius: 4px;
        padding: 1px 5px;
        background: rgba(15, 23, 42, 0.9);
        color: #cbd5e1;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 10px;
      }
      .empty {
        padding: 28px 12px;
        color: #94a3b8;
        font-size: 12px;
        text-align: center;
      }
      .toast {
        position: absolute;
        right: 12px;
        bottom: 40px;
        max-width: calc(100% - 24px);
        border: 1px solid rgba(96, 165, 250, 0.28);
        border-radius: 6px;
        padding: 8px 10px;
        background: #172554;
        color: #dbeafe;
        font-size: 11px;
        box-shadow: 0 12px 36px rgba(2, 6, 23, 0.35);
      }
      .toast[hidden] { display: none; }
    </style>
    <div class="backdrop" data-role="backdrop"></div>
    <section class="panel" role="dialog" aria-label="Tab Pilot command center">
      <div class="search">
        <input data-role="input" placeholder="Search tabs or run a command..." autocomplete="off" spellcheck="false" />
        <div class="meta" data-role="meta">Loading Chrome state...</div>
      </div>
      <div class="list" data-role="list"></div>
      <div class="footer">
        <span><kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Enter</kbd> run</span>
        <span><kbd>Esc</kbd> close · <kbd>⌘/Ctrl Shift K</kbd> open</span>
      </div>
      <div class="toast" data-role="toast" hidden></div>
    </section>
  `;

  shadow.querySelector('[data-role="backdrop"]').addEventListener('click', closeCommandCenter);
  const input = shadow.querySelector('[data-role="input"]');
  input.addEventListener('input', () => {
    commandCenterQuery = input.value;
    commandCenterSelectedIndex = 0;
    renderCommandCenter();
  });
  input.addEventListener('keydown', (event) => {
    const items = getFilteredCommandItems();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      commandCenterSelectedIndex = Math.min(commandCenterSelectedIndex + 1, Math.max(items.length - 1, 0));
      renderCommandCenter();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      commandCenterSelectedIndex = Math.max(commandCenterSelectedIndex - 1, 0);
      renderCommandCenter();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runSelectedCommand();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeCommandCenter();
    }
  });

  document.documentElement.appendChild(commandCenter);
  return commandCenter;
}

async function openCommandCenter() {
  const el = ensureCommandCenter();
  commandCenterQuery = '';
  commandCenterSelectedIndex = 0;
  commandCenterState = null;
  el.classList.add('open');
  renderCommandCenter();
  el.shadowRoot.querySelector('[data-role="input"]').focus();
  await refreshCommandCenterState();
  el.shadowRoot.querySelector('[data-role="input"]').focus();
}

function closeCommandCenter() {
  if (!commandCenter) return;
  commandCenter.classList.remove('open');
}

// ── Messages from background (toolbar icon) ───────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action === 'toggle-tabpilot') toggleSidebar();
  if (msg?.action === 'tabpilot-open-command-center') openCommandCenter();
});

// ── Messages from iframe (collapse button inside the React app) ───────────────
window.addEventListener('message', (e) => {
  if (e.data?.action === 'collapse-tabpilot') hideSidebar();
});

// ── Keyboard shortcut (Ctrl/Cmd + Shift + E) ─────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'E') {
    e.preventDefault();
    toggleSidebar();
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'K') {
    e.preventDefault();
    openCommandCenter();
  }
}, true);
