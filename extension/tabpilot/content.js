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

let isVisible    = false;
let sidebarWidth = DEFAULT_W;

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

// ── Messages from background (toolbar icon) ───────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action === 'toggle-tabpilot') toggleSidebar();
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
}, true);
