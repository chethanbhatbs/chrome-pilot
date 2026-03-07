/**
 * TabPilot Background Service Worker
 * Uses Chrome Side Panel API for persistent sidebar across all tabs.
 * Auto-opens side panel everywhere so users rely on TabPilot instead of the tab bar.
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

// Tab events
chrome.tabs.onCreated.addListener(notifySidepanel);
chrome.tabs.onRemoved.addListener(notifySidepanel);
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status || changeInfo.title || changeInfo.url || changeInfo.audible !== undefined || changeInfo.mutedInfo) {
    notifySidepanel();
  }
});
chrome.tabs.onMoved.addListener(notifySidepanel);
chrome.tabs.onActivated.addListener(notifySidepanel);
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
  if (windowId !== chrome.windows.WINDOW_ID_NONE && !panelOpenWindows.has(windowId)) {
    // Only open if panel hasn't been confirmed open in this window yet —
    // re-opening an already-open panel reloads the React app (blank screen)
    retrySidePanelOpen(windowId, [50, 200, 500, 1200]).then(() => {
      panelOpenWindows.add(windowId);
    });
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
