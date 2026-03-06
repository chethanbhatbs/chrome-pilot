/**
 * TabPilot Background Service Worker
 * Handles: toolbar icon click → toggle sidebar in active tab
 */

// Toggle sidebar when toolbar icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  // Skip chrome:// pages and extension pages (content scripts can't run there)
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle-tabpilot' });
  } catch (e) {
    // Content script not yet injected (e.g. page just loaded) — try scripting injection
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css'],
      });
      // Retry toggle
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: 'toggle-tabpilot' }).catch(() => {});
      }, 100);
    } catch (err) {
      console.error('TabPilot: could not inject content script', err);
    }
  }
});

// Update badge with open tab count
function updateBadge() {
  chrome.tabs.query({}, (tabs) => {
    const count = tabs.length;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#1f6feb' });
  });
}

chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
updateBadge();
