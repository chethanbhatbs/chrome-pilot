/**
 * Chrome Tabs Adapter
 * Detects if running as a Chrome extension or web preview.
 * In extension context: uses real chrome.tabs/windows/tabGroups APIs.
 * In web context: falls back to mock data.
 */

const IS_EXTENSION = typeof chrome !== 'undefined' && !!chrome?.tabs?.query;

export function isExtensionContext() {
  return IS_EXTENSION;
}

// --- Real Chrome API wrappers ---

/**
 * Get all windows by grouping tabs (uses only `tabs` permission — more reliable than
 * chrome.windows.getAll which can fail silently without the `windows` permission being granted).
 */
export async function chromeGetAllWindows() {
  // Step 1: Get ALL tabs from ALL windows — requires only `tabs` permission
  const allTabs = await chrome.tabs.query({});

  // Step 2: Group tabs by windowId (skip tabs with invalid windowId)
  const windowMap = new Map();
  allTabs.forEach(tab => {
    if (!tab.windowId || tab.windowId === -1) return;
    if (!windowMap.has(tab.windowId)) {
      windowMap.set(tab.windowId, {
        id: tab.windowId,
        type: 'normal',
        focused: false,
        state: 'normal',
        tabs: [],
      });
    }
    windowMap.get(tab.windowId).tabs.push(tab);
  });

  // Step 3: Enrich with window metadata (focused, state, type) — best-effort
  try {
    const winInfos = await chrome.windows.getAll({ populate: false });
    winInfos.forEach(w => {
      if (windowMap.has(w.id)) {
        const entry = windowMap.get(w.id);
        entry.focused = w.focused;
        entry.state   = w.state || 'normal';
        entry.type    = w.type  || 'normal';
      }
    });
  } catch {
    // If windows API unavailable, mark first window as focused
    const first = windowMap.values().next().value;
    if (first) first.focused = true;
  }

  // Step 4: Only normal windows, focused first
  return Array.from(windowMap.values())
    .filter(w => w.type === 'normal' || w.type === undefined)
    .sort((a, b) => Number(b.focused) - Number(a.focused));
}

export async function chromeGetTabGroups() {
  try {
    return await chrome.tabGroups.query({});
  } catch {
    return [];
  }
}

export async function chromeSwitchToTab(tabId, windowId) {
  await chrome.tabs.update(tabId, { active: true });
  if (windowId) await chrome.windows.update(windowId, { focused: true });
}

export async function chromeCloseTab(tabId) {
  await chrome.tabs.remove(tabId);
}

export async function chromePinTab(tabId, pinned) {
  await chrome.tabs.update(tabId, { pinned });
}

export async function chromeMuteTab(tabId, muted) {
  await chrome.tabs.update(tabId, { muted });
}

export async function chromeDuplicateTab(tabId) {
  await chrome.tabs.duplicate(tabId);
}

export async function chromeMoveTab(tabId, windowId, index = -1) {
  await chrome.tabs.move(tabId, { windowId, index });
}

export async function chromeMoveTabToNewWindow(tabId) {
  await chrome.windows.create({ tabId });
}

export async function chromeCreateNewTab(windowId) {
  await chrome.tabs.create({ windowId });
}

export async function chromeCreateTabInWindow(windowId) {
  await chrome.tabs.create({ windowId, index: 0 });
}

export async function chromeCreateNewWindow() {
  await chrome.windows.create({});
}

export async function chromeCloseWindow(windowId) {
  await chrome.windows.remove(windowId);
}

export async function chromeMinimizeWindow(windowId, currentState) {
  const newState = currentState === 'minimized' ? 'normal' : 'minimized';
  await chrome.windows.update(windowId, { state: newState });
}

export async function chromeUndoCloseTab() {
  try {
    const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 1 });
    if (sessions.length > 0) {
      const sessionId = sessions[0].tab?.sessionId || sessions[0].window?.sessionId;
      if (sessionId) { await chrome.sessions.restore(sessionId); return true; }
    }
  } catch { /* sessions API unavailable */ }
  return false;
}

// Storage helpers for persisting notes and window names
export function chromeStorageGet(keys) {
  if (!IS_EXTENSION) return Promise.resolve({});
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

export function chromeStorageSet(data) {
  if (!IS_EXTENSION) return;
  chrome.storage.local.set(data);
}

export async function chromeMuteAll() {
  const tabs = await chrome.tabs.query({ audible: true });
  for (const t of tabs) {
    await chrome.tabs.update(t.id, { muted: true });
  }
}

export async function chromeUnmuteAll() {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (t.mutedInfo?.muted) {
      await chrome.tabs.update(t.id, { muted: false });
    }
  }
}

export async function chromeCloseDuplicates() {
  const tabs = await chrome.tabs.query({});
  const urlMap = {};
  const toClose = [];
  for (const tab of tabs) {
    if (tab.url.startsWith('chrome://')) continue;
    try {
      const u = new URL(tab.url);
      const normalized = u.origin + u.pathname.replace(/\/$/, '') + u.search;
      if (urlMap[normalized]) toClose.push(tab.id);
      else urlMap[normalized] = tab.id;
    } catch { /* skip */ }
  }
  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  return toClose.length;
}

export async function chromeDiscardTab(tabId) {
  try {
    await chrome.tabs.discard(tabId);
  } catch {
    // Tab might not be discardable
  }
}

// Listen for tab AND window changes
export function chromeOnTabsUpdated(callback) {
  if (!IS_EXTENSION) return () => {};

  // Background message (from service worker)
  const msgHandler = (msg) => { if (msg?.action === 'tabs-updated') callback(); };
  chrome.runtime.onMessage.addListener(msgHandler);

  // Tab events
  const tabEvents = [
    chrome.tabs.onCreated,
    chrome.tabs.onRemoved,
    chrome.tabs.onUpdated,
    chrome.tabs.onMoved,
    chrome.tabs.onActivated,
    chrome.tabs.onAttached,
    chrome.tabs.onDetached,
  ];
  tabEvents.forEach(e => e?.addListener(callback));

  // Window events — wrapped in try/catch in case `windows` permission not yet granted
  const windowEvents = [];
  try {
    [chrome.windows?.onCreated, chrome.windows?.onRemoved, chrome.windows?.onFocusChanged]
      .filter(Boolean)
      .forEach(e => { e.addListener(callback); windowEvents.push(e); });
  } catch { /* windows permission unavailable */ }

  return () => {
    chrome.runtime.onMessage.removeListener(msgHandler);
    tabEvents.forEach(e => e?.removeListener(callback));
    windowEvents.forEach(e => e?.removeListener(callback));
  };
}
