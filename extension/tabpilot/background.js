/**
 * TabPilot - Background Service Worker
 * Handles badge updates, tab monitoring, and message passing to sidepanel.
 */

// Update badge with tab count
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.length;
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({
      color: count > 20 ? '#f28b82' : count > 10 ? '#fdd663' : '#81c995'
    });
  } catch (e) {
    console.error('Badge update error:', e);
  }
}

// Notify sidepanel of tab changes
function notifySidepanel() {
  chrome.runtime.sendMessage({ action: 'tabs-updated' }).catch(() => {
    // Sidepanel not open, ignore
  });
  updateBadge();
}

// Listen for tab events
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

// Listen for window events
chrome.windows.onCreated.addListener(notifySidepanel);
chrome.windows.onRemoved.addListener(notifySidepanel);
chrome.windows.onFocusChanged.addListener(notifySidepanel);

// Tab group events
try {
  chrome.tabGroups.onCreated.addListener(notifySidepanel);
  chrome.tabGroups.onUpdated.addListener(notifySidepanel);
  chrome.tabGroups.onRemoved.addListener(notifySidepanel);
} catch {
  // tabGroups might not be available in all Chrome versions
}

// Open sidepanel on action click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Initial badge update
updateBadge();
