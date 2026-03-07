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
      } catch { /* window may not support side panel */ }
    }
  } catch {}
}

// On install or update — auto-open in all windows
chrome.runtime.onInstalled.addListener(() => {
  // Small delay to ensure everything is initialized
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

// Notify sidepanel of tab changes
function notifySidepanel() {
  chrome.runtime.sendMessage({ action: 'tabs-updated' }).catch(() => {});
  updateBadge();
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

// Window events — also auto-open side panel in new windows
chrome.windows.onCreated.addListener((window) => {
  notifySidepanel();
  // Auto-open side panel in new windows after a brief delay for initialization
  if (window.type === 'normal') {
    setTimeout(async () => {
      try { await chrome.sidePanel.open({ windowId: window.id }); } catch {}
    }, 300);
  }
});
chrome.windows.onRemoved.addListener(notifySidepanel);
chrome.windows.onFocusChanged.addListener(notifySidepanel);

// Tab group events
try {
  chrome.tabGroups.onCreated.addListener(notifySidepanel);
  chrome.tabGroups.onUpdated.addListener(notifySidepanel);
  chrome.tabGroups.onRemoved.addListener(notifySidepanel);
} catch {}

// Initial badge
updateBadge();
