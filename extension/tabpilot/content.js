/**
 * TabPilot Content Script
 * Injects a left-side sidebar iframe into every webpage.
 * Toggle: Ctrl+Shift+E (Mac: Cmd+Shift+E) or toolbar icon click.
 */

const SIDEBAR_WIDTH = 400;
const SIDEBAR_ID    = '__tabpilot_root__';
const IFRAME_ID     = '__tabpilot_iframe__';

let isVisible = false;
let sidebar    = null;

// ── Build the sidebar DOM ─────────────────────────────────────────────────────
function buildSidebar() {
  if (document.getElementById(SIDEBAR_ID)) return;

  sidebar = document.createElement('div');
  sidebar.id = SIDEBAR_ID;

  const iframe = document.createElement('iframe');
  iframe.id    = IFRAME_ID;
  iframe.src   = chrome.runtime.getURL('sidepanel/index.html');
  iframe.title = 'TabPilot';
  iframe.allow = 'clipboard-read; clipboard-write';

  sidebar.appendChild(iframe);
  document.documentElement.appendChild(sidebar);
}

// ── Show / hide ───────────────────────────────────────────────────────────────
function showSidebar() {
  buildSidebar();
  sidebar = document.getElementById(SIDEBAR_ID);
  sidebar.classList.add('tabpilot--open');
  document.documentElement.classList.add('tabpilot-active');
  isVisible = true;
}

function hideSidebar() {
  const el = document.getElementById(SIDEBAR_ID);
  if (el) el.classList.remove('tabpilot--open');
  document.documentElement.classList.remove('tabpilot-active');
  isVisible = false;
}

function toggleSidebar() {
  if (isVisible) hideSidebar();
  else showSidebar();
}

// ── Message from background (toolbar icon click) ─────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action === 'toggle-tabpilot') toggleSidebar();
});

// ── Keyboard shortcut (backup: Ctrl+Shift+E) ─────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'E') {
    e.preventDefault();
    toggleSidebar();
  }
}, true);
