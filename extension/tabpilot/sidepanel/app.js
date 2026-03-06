// TabPilot Side Panel App — uses real Chrome APIs
// =============================================

let allWindows = [];
let allTabGroups = [];
let searchQuery = '';
let viewMode = 'window'; // 'window' | 'domain'

// --- Chrome API Wrappers ---
async function fetchAllData() {
  try {
    const windows = await chrome.windows.getAll({ populate: true });
    allWindows = windows.filter(w => w.type === 'normal');
    try { allTabGroups = await chrome.tabGroups.query({}); } catch { allTabGroups = []; }
    render();
  } catch (e) { console.error('Fetch error:', e); }
}

function getAllTabs() {
  return allWindows.flatMap(w => w.tabs || []);
}

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function getFavicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return ''; }
}

function normalizeUrl(url) {
  try { const u = new URL(url); return u.origin + u.pathname.replace(/\/$/, '') + u.search; } catch { return url; }
}

function findDuplicates() {
  const tabs = getAllTabs();
  const map = {};
  tabs.forEach(t => {
    if (t.url.startsWith('chrome://')) return;
    const norm = normalizeUrl(t.url);
    if (!map[norm]) map[norm] = [];
    map[norm].push(t);
  });
  return Object.entries(map).filter(([, tabs]) => tabs.length > 1);
}

// --- Rendering ---
function render() {
  renderTabTree();
  renderStats();
}

function renderTabTree() {
  const container = document.getElementById('tabTree');
  const tabs = getAllTabs();
  const filtered = searchQuery
    ? tabs.filter(t => t.title.toLowerCase().includes(searchQuery) || t.url.toLowerCase().includes(searchQuery))
    : tabs;

  if (viewMode === 'domain') {
    renderDomainView(container, filtered);
  } else {
    renderWindowView(container, filtered);
  }
}

function renderWindowView(container, filteredTabs) {
  const filteredIds = new Set(filteredTabs.map(t => t.id));
  let html = '';
  for (const win of allWindows) {
    const winTabs = win.tabs.filter(t => filteredIds.has(t.id));
    if (winTabs.length === 0) continue;
    html += `<div class="border-b border-white/[0.08]">
      <div class="window-header ${win.focused ? 'focused' : ''} flex items-center justify-between px-2 py-1.5 cursor-pointer" onclick="toggleWindow(${win.id})">
        <div class="flex items-center gap-1.5">
          <svg class="w-3 h-3 text-gray-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <svg class="w-3.5 h-3.5 ${win.focused ? 'text-tp-highlight' : 'text-gray-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" stroke-width="1.5"/><path d="M8 21h8m-4-4v4" stroke-width="1.5"/></svg>
          <span class="text-xs font-heading font-semibold">Window ${win.id}</span>
          <span class="text-[10px] text-gray-500 font-mono">(${winTabs.length})</span>
          ${win.focused ? '<span class="text-[9px] text-tp-highlight font-mono uppercase tracking-wider">active</span>' : ''}
        </div>
        <div class="flex items-center gap-0.5">
          <button onclick="event.stopPropagation();chrome.windows.update(${win.id},{state:'minimized'})" class="p-0.5 rounded text-gray-500 hover:text-gray-200 hover:bg-white/10">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.5" d="M5 12h14"/></svg>
          </button>
          <button onclick="event.stopPropagation();chrome.windows.remove(${win.id})" class="p-0.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="py-0.5">${winTabs.map(t => renderTab(t)).join('')}</div>
    </div>`;
  }
  // Duplicates
  const dupes = findDuplicates();
  if (dupes.length > 0) {
    const count = dupes.reduce((s, [, tabs]) => s + tabs.length - 1, 0);
    html += `<div class="mx-2 my-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
      <div class="flex items-center justify-between">
        <span class="text-xs text-amber-500 font-medium">${count} duplicate${count > 1 ? 's' : ''}</span>
        <button onclick="closeDuplicates()" class="text-[10px] font-heading font-semibold text-amber-500 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded">Fix All</button>
      </div>
    </div>`;
  }
  container.innerHTML = html;
}

function renderDomainView(container, filteredTabs) {
  const domains = {};
  filteredTabs.forEach(t => {
    const d = getDomain(t.url);
    if (!domains[d]) domains[d] = [];
    domains[d].push(t);
  });
  const sorted = Object.entries(domains).sort((a, b) => b[1].length - a[1].length);
  let html = '';
  for (const [domain, tabs] of sorted) {
    html += `<div class="border-b border-white/[0.08]">
      <div class="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-white/[0.04]">
        <img src="${getFavicon(tabs[0].url)}" class="w-3.5 h-3.5 rounded-sm" onerror="this.style.display='none'">
        <span class="text-xs font-heading font-semibold">${domain}</span>
        <span class="text-[10px] text-gray-500 font-mono">(${tabs.length})</span>
      </div>
      <div class="py-0.5">${tabs.map(t => renderTab(t)).join('')}</div>
    </div>`;
  }
  container.innerHTML = html;
}

function renderTab(tab) {
  const domain = getDomain(tab.url);
  const isActive = tab.active;
  const isPinned = tab.pinned;
  const isAudible = tab.audible && !tab.mutedInfo?.muted;
  const isMuted = tab.mutedInfo?.muted;
  const isLoading = tab.status === 'loading';

  return `<div class="tab-item ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''} flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-md mx-0.5 animate-slide-in"
    draggable="true" onclick="switchToTab(${tab.id},${tab.windowId})" data-tab-id="${tab.id}">
    <div class="w-4 h-4 shrink-0 flex items-center justify-center">
      ${isLoading
        ? '<svg class="w-3 h-3 animate-spin text-tp-highlight" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75"/></svg>'
        : `<img src="${getFavicon(tab.url)}" class="w-4 h-4 rounded-sm" onerror="this.outerHTML='<div class=\\'w-3 h-3 rounded-full bg-gray-600\\'></div>'">`}
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-xs leading-tight truncate">${highlightMatch(tab.title)}</div>
      <div class="text-[10px] text-gray-500 truncate leading-tight">${highlightMatch(domain)}</div>
    </div>
    <div class="flex items-center gap-0.5 shrink-0">
      ${isPinned ? '<svg class="w-2.5 h-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>' : ''}
      ${isAudible ? '<span class="text-tp-audible animate-pulse-glow"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg></span>' : ''}
      ${isMuted ? '<button onclick="event.stopPropagation();toggleMute(${tab.id})" class="p-0.5 text-gray-500 hover:text-gray-200"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg></button>' : ''}
      <div class="actions flex items-center gap-0.5">
        <button onclick="event.stopPropagation();chrome.tabs.update(${tab.id},{pinned:${!isPinned}})" class="p-0.5 rounded text-gray-500 hover:text-yellow-400 hover:bg-white/10">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.5" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
        </button>
        <button onclick="event.stopPropagation();chrome.tabs.remove(${tab.id})" class="p-0.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

function highlightMatch(text) {
  if (!searchQuery) return text;
  const idx = text.toLowerCase().indexOf(searchQuery);
  if (idx === -1) return text;
  return text.slice(0, idx) + `<mark class="bg-tp-highlight/30 text-inherit rounded-sm px-0.5">${text.slice(idx, idx + searchQuery.length)}</mark>` + text.slice(idx + searchQuery.length);
}

function renderStats() {
  const tabs = getAllTabs();
  const bar = document.getElementById('statsBar');
  const dupeCount = findDuplicates().reduce((s, [, t]) => s + t.length - 1, 0);
  bar.innerHTML = `
    <span class="text-tp-highlight">${allWindows.length} win</span>
    <span>${tabs.length} tabs</span>
    <span class="${tabs.some(t => t.audible) ? 'text-tp-audible' : 'text-gray-500'}">${tabs.filter(t => t.audible && !t.mutedInfo?.muted).length} audio</span>
    <span class="${tabs.some(t => t.pinned) ? 'text-tp-pinned' : 'text-gray-500'}">${tabs.filter(t => t.pinned).length} pinned</span>
    <span class="${dupeCount > 0 ? 'text-tp-duplicate' : 'text-gray-500'}">${dupeCount} dupes</span>
  `;
}

// --- Actions ---
async function switchToTab(tabId, windowId) {
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(windowId, { focused: true });
}

async function toggleMute(tabId) {
  const tab = await chrome.tabs.get(tabId);
  await chrome.tabs.update(tabId, { muted: !tab.mutedInfo.muted });
}

async function closeDuplicates() {
  const dupes = findDuplicates();
  const toClose = [];
  for (const [, tabs] of dupes) {
    for (let i = 1; i < tabs.length; i++) toClose.push(tabs[i].id);
  }
  if (toClose.length > 0) await chrome.tabs.remove(toClose);
}

// --- Quick Actions ---
const quickActionsContainer = document.getElementById('quickActions');
const quickActions = [
  { label: 'New Tab', icon: '+', action: () => chrome.tabs.create({}) },
  { label: 'New Window', icon: 'W', action: () => chrome.windows.create({}) },
  { label: 'Close Dupes', icon: 'D', action: closeDuplicates },
  { label: 'Mute All', icon: 'M', action: async () => { const tabs = await chrome.tabs.query({ audible: true }); for (const t of tabs) await chrome.tabs.update(t.id, { muted: true }); } },
  { label: 'Domain View', icon: 'G', action: () => { viewMode = viewMode === 'window' ? 'domain' : 'window'; render(); } },
];
quickActions.forEach(({ label, icon, action }) => {
  const btn = document.createElement('button');
  btn.className = 'p-1.5 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-all text-[10px] font-heading font-bold';
  btn.title = label;
  btn.textContent = icon;
  btn.onclick = action;
  quickActionsContainer.appendChild(btn);
});

// --- Search ---
document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  render();
});

// --- Message Listener ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'tabs-updated') fetchAllData();
  if (msg.action === 'focus-search') document.getElementById('searchInput').focus();
});

// --- Init ---
fetchAllData();
