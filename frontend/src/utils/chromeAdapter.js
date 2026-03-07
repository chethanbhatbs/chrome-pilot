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
    if (!tab.url) continue;
    let normalized;
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      normalized = tab.url.replace(/\/$/, '');
    } else {
      try {
        const u = new URL(tab.url);
        normalized = u.origin + u.pathname.replace(/\/$/, '') + u.search;
      } catch { continue; }
    }
    if (urlMap[normalized]) toClose.push(tab.id);
    else urlMap[normalized] = tab.id;
  }
  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  return toClose.length;
}

// Focus mode / workspace: hide non-focus tabs by grouping & collapsing
// Groups per-window since chrome.tabs.group only works within a single window
export async function chromeHideTabs(tabIds) {
  if (!tabIds.length) return null;
  try {
    // Get tab details to group by window
    const allTabs = await chrome.tabs.query({});
    const tabMap = new Map(allTabs.map(t => [t.id, t]));
    const byWindow = new Map();
    for (const id of tabIds) {
      const tab = tabMap.get(id);
      if (!tab) continue;
      if (!byWindow.has(tab.windowId)) byWindow.set(tab.windowId, []);
      byWindow.get(tab.windowId).push(id);
    }

    const groupIds = [];
    for (const [windowId, winTabIds] of byWindow) {
      try {
        // Don't hide ALL tabs in a window — Chrome won't allow grouping the active tab if it's the only one left
        const windowTabs = allTabs.filter(t => t.windowId === windowId);
        const remainingUngrouped = windowTabs.filter(t => !winTabIds.includes(t.id));
        if (remainingUngrouped.length === 0) continue; // skip — can't hide all tabs in a window

        const groupId = await chrome.tabs.group({ tabIds: winTabIds });
        await chrome.tabGroups.update(groupId, { collapsed: true, title: 'Hidden', color: 'grey' });
        try { await chrome.tabGroups.move(groupId, { index: -1 }); } catch {}
        groupIds.push(groupId);
      } catch (e) {
        console.error('chromeHideTabs window error:', windowId, e);
      }
    }
    return groupIds.length === 1 ? groupIds[0] : groupIds;
  } catch (e) {
    console.error('chromeHideTabs error:', e);
    return null;
  }
}

// Ungroup ALL tabs in every "Hidden" group across all windows.
// This is the only reliable way — stored tab IDs can go stale.
export async function chromeUnhideTabs() {
  try {
    const groups = await chrome.tabGroups.query({});
    const hiddenGroups = groups.filter(g => g.title === 'Hidden');
    if (hiddenGroups.length === 0) return;

    const allTabs = await chrome.tabs.query({});
    for (const group of hiddenGroups) {
      const groupTabs = allTabs.filter(t => t.groupId === group.id);
      if (groupTabs.length > 0) {
        try {
          await chrome.tabs.ungroup(groupTabs.map(t => t.id));
        } catch {
          // Try individually if bulk fails
          for (const t of groupTabs) {
            try { await chrome.tabs.ungroup([t.id]); } catch {}
          }
        }
      }
    }
  } catch (e) {
    console.error('chromeUnhideTabs error:', e);
  }
}

function isRestorableUrl(url) {
  if (!url) return false;
  // Chrome blocks extensions from opening these URL schemes
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
      url.startsWith('about:') || url.startsWith('javascript:') ||
      url.startsWith('data:') || url.startsWith('file:')) {
    return false;
  }
  return true;
}

export async function chromeRestoreSession(session) {
  if (!session?.windows?.length) return 0;
  let tabCount = 0;
  for (const win of session.windows) {
    if (!win.tabs?.length) continue;
    try {
      // Filter to restorable tabs only
      const restorableTabs = win.tabs.filter(t => isRestorableUrl(t.url));
      if (restorableTabs.length === 0) continue;

      // Create window with the first restorable tab
      const firstTab = restorableTabs[0];
      const newWin = await chrome.windows.create({ url: firstTab.url, focused: false });
      if (firstTab.pinned && newWin.tabs?.[0]) {
        try { await chrome.tabs.update(newWin.tabs[0].id, { pinned: true }); } catch {}
      }
      tabCount++;

      // Add remaining tabs sequentially with small delay for stability
      for (let i = 1; i < restorableTabs.length; i++) {
        const t = restorableTabs[i];
        try {
          await chrome.tabs.create({
            windowId: newWin.id,
            url: t.url,
            pinned: t.pinned || false,
            active: false,
          });
          tabCount++;
        } catch (err) {
          console.warn('chromeRestoreSession tab error:', t.url, err);
        }
      }
      // Focus the window after all tabs are created
      try { await chrome.windows.update(newWin.id, { focused: true }); } catch {}
    } catch (e) {
      console.error('chromeRestoreSession window error:', e);
    }
  }
  return tabCount;
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

// --- Native Messaging: Chrome Profile Management ---

const NATIVE_HOST_NAME = 'com.tabpilot.profiles';

function sendNativeMessage(message) {
  if (!IS_EXTENSION || !chrome?.runtime?.sendNativeMessage) return Promise.resolve(null);
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

export async function chromeNativeHostPing() {
  return await sendNativeMessage({ action: 'ping' });
}

export async function chromeGetProfiles() {
  return await sendNativeMessage({ action: 'get-profiles' });
}

export async function chromeSwitchProfile(profileDirectory) {
  return await sendNativeMessage({ action: 'switch-profile', profileDirectory });
}
