/**
 * ChromePilot Background Service Worker
 * Uses Chrome Side Panel API for persistent sidebar across all tabs.
 * Auto-opens side panel everywhere so users rely on ChromePilot instead of the tab bar.
 */

// Enable side panel to auto-open when toolbar icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Auto-open side panel in all existing windows
async function openSidePanelEverywhere() {
  try {
    const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
    for (const win of windows) {
      try {
        await chrome.sidePanel.open({ windowId: win.id });
        panelOpenWindows.add(win.id);
      } catch { /* window may not support side panel */ }
    }
  } catch {}
}

// On install or update — auto-open in all windows
chrome.runtime.onInstalled.addListener(() => {
  setTimeout(openSidePanelEverywhere, 500);
});

// On browser startup — auto-open in all windows
chrome.runtime.onStartup.addListener(() => {
  setTimeout(openSidePanelEverywhere, 500);
});

// Update badge with open tab count
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.length;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#1f6feb' });
  } catch (e) {
    console.error('Badge update error:', e);
  }
}

// Debounced notification — prevents cascade of rapid-fire events from overwhelming
// the side panel with refreshes (which causes lag and can make Chrome kill the panel)
let notifyTimer = null;
function notifySidepanel() {
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'tabs-updated' }).catch(() => {});
    updateBadge();
  }, 100);
}

// ── Focus Mode: strict tab/window restriction ─────────────────────
// When focus mode is active:
// - Block switching to non-focus tabs (force back to a focus tab)
// - Close any newly created tabs immediately
// - Close any newly created windows and refocus a focus window
// - Block window switches to windows without focus tabs
let focusModeState = null; // { focusTabIds: Set<number>, focusWindowIds: Set<number> }

// Build focus state from storage data
function buildFocusState(saved) {
  if (!saved?.active || !saved.focusTabIds?.length) return null;
  const focusTabIds = new Set(saved.focusTabIds);
  // Derive which windows contain focus tabs (computed async below)
  return { focusTabIds, focusWindowIds: new Set() };
}

// Refresh focusWindowIds from actual tab state
async function refreshFocusWindowIds() {
  if (!focusModeState) return;
  try {
    const allTabs = await chrome.tabs.query({});
    const windowIds = new Set();
    for (const tab of allTabs) {
      if (focusModeState.focusTabIds.has(tab.id)) {
        windowIds.add(tab.windowId);
      }
    }
    focusModeState.focusWindowIds = windowIds;
  } catch {}
}

// Load persisted focus state on startup
chrome.storage.local.get(['tabpilot_focus'], (data) => {
  focusModeState = buildFocusState(data?.tabpilot_focus);
  if (focusModeState) { refreshFocusWindowIds(); startFocusGuard(); }
});

// Listen for focus state changes from the sidepanel
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tabpilot_focus) {
    focusModeState = buildFocusState(changes.tabpilot_focus.newValue);
    if (focusModeState) { refreshFocusWindowIds(); startFocusGuard(); }
    else { stopFocusGuard(); }
  }
});

// Helper: find the best focus tab to switch to (prefer same window, then any)
async function findFocusTab(preferWindowId) {
  const allTabs = await chrome.tabs.query({});
  // Prefer a focus tab in the same window
  if (preferWindowId) {
    const sameWindow = allTabs.find(t => t.windowId === preferWindowId && focusModeState.focusTabIds.has(t.id));
    if (sameWindow) return sameWindow;
  }
  // Any focus tab in any window
  return allTabs.find(t => focusModeState.focusTabIds.has(t.id)) || null;
}

// Helper: force-switch to a focus tab
async function enforceActiveFocusTab(preferWindowId) {
  const tab = await findFocusTab(preferWindowId);
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  }
}

// Inject a page-level notification directly into the active tab using chrome.scripting
// Works on any already-open tab — no content script registration needed.
// Also sends to sidebar for redundancy.
let _lastNotifyTime = 0;
function notifyFocusBlocked(reason) {
  // Throttle — max once per 2 seconds
  const now = Date.now();
  if (now - _lastNotifyTime < 2000) return;
  _lastNotifyTime = now;

  // 1. Sidebar toast
  chrome.runtime.sendMessage({ action: 'focus-blocked', reason }).catch(() => {});

  // 2. Page overlay — injected after enforceActiveFocusTab settles
  setTimeout(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab?.id) return;
      // Can't inject into chrome:// or extension pages
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) return;

      const messages = {
        'new-tab': 'New tabs are blocked in Focus Mode',
        'new-window': 'New windows are blocked in Focus Mode',
        'switch-tab': 'This tab is not in your focus set',
      };
      const text = messages[reason] || 'Action blocked — Focus Mode active';

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (msg) => {
          // Avoid duplicates
          const existing = document.getElementById('__tabpilot_focus_notif');
          if (existing) existing.remove();

          const host = document.createElement('div');
          host.id = '__tabpilot_focus_notif';
          Object.assign(host.style, {
            position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%) translateY(-20px)',
            zIndex: '2147483647', opacity: '0',
            transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, sans-serif",
            pointerEvents: 'none',
          });

          const card = document.createElement('div');
          Object.assign(card.style, {
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 20px', background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)', whiteSpace: 'nowrap',
          });

          const icon = document.createElement('div');
          Object.assign(icon.style, {
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'rgba(99,102,241,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: '0',
          });
          icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

          const textWrap = document.createElement('div');
          const title = document.createElement('div');
          Object.assign(title.style, { fontSize: '13px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.3' });
          title.textContent = msg;
          const desc = document.createElement('div');
          Object.assign(desc.style, { fontSize: '11px', color: '#94a3b8', lineHeight: '1.3', marginTop: '2px' });
          desc.textContent = 'Exit Focus Mode to access other tabs';
          textWrap.appendChild(title);
          textWrap.appendChild(desc);

          card.appendChild(icon);
          card.appendChild(textWrap);
          host.appendChild(card);
          document.documentElement.appendChild(host);

          // Animate in
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              host.style.opacity = '1';
              host.style.transform = 'translateX(-50%) translateY(0)';
            });
          });

          // Auto-remove after 3s
          setTimeout(() => {
            host.style.opacity = '0';
            host.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => host.remove(), 400);
          }, 3000);
        },
        args: [text],
      }).catch(() => {});
    } catch {}
  }, 300);
}

// Re-collapse hidden groups AND move them to the end (user may have expanded them)
async function recollapseHiddenGroups() {
  try {
    const groups = await chrome.tabGroups.query({});
    for (const g of groups) {
      if (g.title === 'Hidden' && !g.collapsed) {
        await chrome.tabGroups.update(g.id, { collapsed: true });
      }
    }
  } catch {}
}

// Periodic guard — catches cases where event listeners miss (e.g. Chrome internal navigation)
let focusGuardInterval = null;
function startFocusGuard() {
  if (focusGuardInterval) return;
  focusGuardInterval = setInterval(async () => {
    if (!focusModeState) { stopFocusGuard(); return; }
    try {
      // Re-collapse any expanded Hidden groups
      recollapseHiddenGroups();
      // Ensure active tab in the focused Chrome window is a focus tab
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!activeTab) return;
      if (!focusModeState.focusTabIds.has(activeTab.id)) {
        // Wrong tab or wrong window — force back
        const focusTab = await findFocusTab();
        if (focusTab) {
          await chrome.windows.update(focusTab.windowId, { focused: true });
          await chrome.tabs.update(focusTab.id, { active: true });
        }
      }
    } catch {}
  }, 500);
}
function stopFocusGuard() {
  if (focusGuardInterval) { clearInterval(focusGuardInterval); focusGuardInterval = null; }
}

// Tab events
chrome.tabs.onCreated.addListener((tab) => {
  notifySidepanel();
  // Focus mode: close any newly created tab that isn't a focus tab
  if (focusModeState && !focusModeState.focusTabIds.has(tab.id)) {
    chrome.tabs.remove(tab.id).catch(() => {});
    enforceActiveFocusTab(tab.windowId);
    notifyFocusBlocked('new-tab');
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  notifySidepanel();
  // If a focus tab was closed, update our state
  if (focusModeState && focusModeState.focusTabIds.has(tabId)) {
    focusModeState.focusTabIds.delete(tabId);
    refreshFocusWindowIds();
    // If no focus tabs left, auto-exit focus mode
    if (focusModeState.focusTabIds.size === 0) {
      focusModeState = null;
      chrome.storage.local.set({ tabpilot_focus: null });
    }
  }
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status || changeInfo.title || changeInfo.url || changeInfo.audible !== undefined || changeInfo.mutedInfo) {
    notifySidepanel();
  }
});
chrome.tabs.onMoved.addListener(notifySidepanel);
chrome.tabs.onActivated.addListener((activeInfo) => {
  notifySidepanel();
  // Focus mode: if user activated a non-focus tab, force back + re-collapse hidden groups
  if (focusModeState && !focusModeState.focusTabIds.has(activeInfo.tabId)) {
    enforceActiveFocusTab(activeInfo.windowId);
    recollapseHiddenGroups();
    notifyFocusBlocked('switch-tab');
  }
});
chrome.tabs.onAttached.addListener(notifySidepanel);
chrome.tabs.onDetached.addListener(notifySidepanel);

// Retry sidePanel.open with multiple attempts — Chrome often rejects the first
// call when a window is newly created or focused (no user gesture context yet)
async function retrySidePanelOpen(windowId, delays) {
  for (const delay of delays) {
    await new Promise(r => setTimeout(r, delay));
    try {
      await chrome.sidePanel.open({ windowId });
      return; // success — stop retrying
    } catch { /* expected on early attempts */ }
  }
}

// Track which windows have the side panel confirmed open
const panelOpenWindows = new Set();

// Window events — also auto-open side panel in new/focused windows
chrome.windows.onCreated.addListener((window) => {
  notifySidepanel();
  // Focus mode: close any newly created window and return to a focus window
  if (focusModeState && window.type === 'normal') {
    // Small delay to let Chrome finish creating the window before we close it
    setTimeout(async () => {
      try {
        // Don't close if this window somehow contains focus tabs (edge case)
        const winTabs = await chrome.tabs.query({ windowId: window.id });
        const hasFocusTab = winTabs.some(t => focusModeState?.focusTabIds.has(t.id));
        if (!hasFocusTab) {
          await chrome.windows.remove(window.id);
          panelOpenWindows.delete(window.id);
          await enforceActiveFocusTab();
          notifyFocusBlocked('new-window');
        }
      } catch {}
    }, 100);
    return; // Skip side panel open for windows we're about to close
  }
  if (window.type === 'normal') {
    retrySidePanelOpen(window.id, [100, 300, 700, 1500, 3000]).then(() => {
      panelOpenWindows.add(window.id);
    });
  }
});
chrome.windows.onRemoved.addListener((windowId) => {
  notifySidepanel();
  panelOpenWindows.delete(windowId);
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  notifySidepanel();

  // WINDOW_ID_NONE means Chrome lost focus (user switched to another app) — allow this
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  if (!panelOpenWindows.has(windowId)) {
    retrySidePanelOpen(windowId, [50, 200, 500, 1200]).then(() => {
      panelOpenWindows.add(windowId);
    });
  }

  // Focus mode: block switching between Chrome windows
  // Only allow the window(s) that contain focus tabs
  if (focusModeState) {
    (async () => {
      try {
        // Check if this Chrome window has any focus tabs
        const winTabs = await chrome.tabs.query({ windowId });
        const hasFocusTab = winTabs.some(t => focusModeState?.focusTabIds.has(t.id));

        if (!hasFocusTab) {
          // This is a non-focus Chrome window — force back to a focus window
          const focusTab = await findFocusTab();
          if (focusTab) {
            // Focus the correct window first, then activate the tab
            await chrome.windows.update(focusTab.windowId, { focused: true });
            await chrome.tabs.update(focusTab.id, { active: true });
          }
          notifyFocusBlocked('switch-tab');
        } else {
          // Correct window, but ensure active tab is a focus tab
          const [activeTab] = await chrome.tabs.query({ windowId, active: true });
          if (activeTab && !focusModeState.focusTabIds.has(activeTab.id)) {
            const focusTab = winTabs.find(t => focusModeState.focusTabIds.has(t.id));
            if (focusTab) await chrome.tabs.update(focusTab.id, { active: true });
          }
        }
      } catch {}
    })();
  }
});

// Tab group events
try {
  chrome.tabGroups.onCreated.addListener(notifySidepanel);
  chrome.tabGroups.onUpdated.addListener(notifySidepanel);
  chrome.tabGroups.onRemoved.addListener(notifySidepanel);
} catch {}

// Initial badge
updateBadge();
