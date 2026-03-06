// TabPilot Background Service Worker
// Handles: side panel opening, badge updates, keyboard shortcuts, duplicate detection

// Open side panel on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Update badge with tab count
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});
    chrome.action.setBadgeText({ text: String(tabs.length) });
    chrome.action.setBadgeBackgroundColor({ color: '#0f3460' });
  } catch (e) {
    console.error('Badge update error:', e);
  }
}

// Close duplicate tabs
async function closeDuplicateTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    const urlMap = {};
    const toClose = [];
    for (const tab of tabs) {
      if (tab.url.startsWith('chrome://')) continue;
      try {
        const u = new URL(tab.url);
        const normalized = u.origin + u.pathname.replace(/\/$/, '') + u.search;
        if (urlMap[normalized]) {
          toClose.push(tab.id);
        } else {
          urlMap[normalized] = tab.id;
        }
      } catch { /* skip invalid URLs */ }
    }
    if (toClose.length > 0) {
      await chrome.tabs.remove(toClose);
    }
    return toClose.length;
  } catch (e) {
    console.error('Close duplicates error:', e);
    return 0;
  }
}

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === 'search-tabs') {
    chrome.runtime.sendMessage({ action: 'focus-search' });
  }
  if (command === 'close-duplicates') {
    closeDuplicateTabs().then(count => {
      chrome.runtime.sendMessage({ action: 'duplicates-closed', count });
    });
  }
});

// Tab event listeners for badge updates
chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);

// Notify side panel of tab changes
function notifyTabsUpdated() {
  chrome.runtime.sendMessage({ action: 'tabs-updated' }).catch(() => {
    // Side panel might not be open
  });
}

chrome.tabs.onCreated.addListener(notifyTabsUpdated);
chrome.tabs.onRemoved.addListener(notifyTabsUpdated);
chrome.tabs.onUpdated.addListener(notifyTabsUpdated);
chrome.tabs.onMoved.addListener(notifyTabsUpdated);
chrome.tabs.onActivated.addListener(notifyTabsUpdated);
chrome.tabs.onDetached.addListener(notifyTabsUpdated);
chrome.tabs.onAttached.addListener(notifyTabsUpdated);
chrome.windows.onCreated.addListener(notifyTabsUpdated);
chrome.windows.onRemoved.addListener(notifyTabsUpdated);
chrome.windows.onFocusChanged.addListener(notifyTabsUpdated);

// Tab group change listeners
try {
  chrome.tabGroups.onCreated.addListener(notifyTabsUpdated);
  chrome.tabGroups.onUpdated.addListener(notifyTabsUpdated);
  chrome.tabGroups.onRemoved.addListener(notifyTabsUpdated);
} catch (e) {
  // tabGroups API might not be available
}

// Initial badge update
updateBadge();
