import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  isExtensionContext, chromeGetAllWindows, chromeGetTabGroups,
  chromeSwitchToTab, chromeCloseTab, chromePinTab, chromeMuteTab,
  chromeDuplicateTab, chromeMoveTab, chromeMoveTabToNewWindow,
  chromeCreateNewTab, chromeCreateTabInWindow, chromeCreateNewWindow,
  chromeCloseWindow, chromeMinimizeWindow, chromeMuteAll, chromeUnmuteAll,
  chromeCloseDuplicates, chromeDiscardTab, chromeOnTabsUpdated,
  chromeUndoCloseTab, chromeStorageGet, chromeStorageSet,
} from '@/utils/chromeAdapter';

/**
 * Hook that connects to real Chrome APIs when running as extension.
 * Returns empty/no-op state when called from web preview context.
 */
export function useChromeTabs() {
  const [windows, setWindows] = useState([]);
  const [tabGroups, setTabGroups] = useState([]);
  const [suspendedTabs, setSuspendedTabs] = useState(new Set());
  const [tabNotes, setTabNotes] = useState({});
  const [windowNames, setWindowNames] = useState({});
  const refreshRef = useRef(null);

  // Load persisted data from chrome.storage on mount
  useEffect(() => {
    if (!isExtensionContext()) return;
    chromeStorageGet(['tabNotes', 'windowNames']).then(data => {
      if (data.tabNotes) setTabNotes(data.tabNotes);
      if (data.windowNames) setWindowNames(data.windowNames);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!isExtensionContext()) return;
    try {
      const wins = await chromeGetAllWindows();
      setWindows(wins);
      const groups = await chromeGetTabGroups();
      setTabGroups(groups);
    } catch (e) {
      console.error('Chrome tabs refresh error:', e);
    }
  }, []);

  refreshRef.current = refresh;

  useEffect(() => {
    if (!isExtensionContext()) return;
    // Immediate fetch + one retry after 300ms (handles extension initialization timing)
    refresh();
    const retryTimer = setTimeout(() => refreshRef.current?.(), 300);
    const cleanup = chromeOnTabsUpdated(() => refreshRef.current?.());
    const interval = setInterval(() => refreshRef.current?.(), 2000);
    return () => { clearTimeout(retryTimer); cleanup(); clearInterval(interval); };
  }, [refresh]);

  // Merge stored window names into windows
  const windowsWithNames = useMemo(() =>
    windows.map(w => ({ ...w, name: windowNames[w.id] || null })),
    [windows, windowNames]
  );

  const allTabs = useMemo(() =>
    windowsWithNames.flatMap(w => (w.tabs || []).map(t => ({ ...t, windowId: w.id }))),
    [windowsWithNames]
  );

  const switchToTab = useCallback(async (tabId) => {
    const tab = allTabs.find(t => t.id === tabId);
    await chromeSwitchToTab(tabId, tab?.windowId);
  }, [allTabs]);

  const closeTab = useCallback(async (tabId) => {
    await chromeCloseTab(tabId);
  }, []);

  const undoCloseTab = useCallback(async () => {
    return await chromeUndoCloseTab();
  }, []);

  const pinTab = useCallback(async (tabId) => {
    const tab = allTabs.find(t => t.id === tabId);
    if (tab) await chromePinTab(tabId, !tab.pinned);
  }, [allTabs]);

  const muteTab = useCallback(async (tabId) => {
    const tab = allTabs.find(t => t.id === tabId);
    if (tab) await chromeMuteTab(tabId, !tab.mutedInfo?.muted);
  }, [allTabs]);

  const duplicateTab = useCallback(async (tabId) => {
    await chromeDuplicateTab(tabId);
  }, []);

  const moveTab = useCallback(async (tabId, windowId, index = -1) => {
    await chromeMoveTab(tabId, windowId, index);
  }, []);

  const moveTabToNewWindow = useCallback(async (tabId) => {
    await chromeMoveTabToNewWindow(tabId);
  }, []);

  const closeWindow = useCallback(async (windowId) => {
    await chromeCloseWindow(windowId);
  }, []);

  const minimizeWindow = useCallback(async (windowId) => {
    const win = windows.find(w => w.id === windowId);
    await chromeMinimizeWindow(windowId, win?.state);
  }, [windows]);

  const createNewTab = useCallback(async () => {
    const focused = windows.find(w => w.focused);
    await chromeCreateNewTab(focused?.id);
  }, [windows]);

  const createTabInWindow = useCallback(async (windowId) => {
    await chromeCreateTabInWindow(windowId);
  }, []);

  const createNewWindow = useCallback(async () => {
    await chromeCreateNewWindow();
  }, []);

  const renameWindow = useCallback((windowId, name) => {
    setWindowNames(prev => {
      const updated = { ...prev, [windowId]: name };
      chromeStorageSet({ windowNames: updated });
      return updated;
    });
  }, []);

  const muteAll = useCallback(async () => {
    await chromeMuteAll();
  }, []);

  const unmuteAll = useCallback(async () => {
    await chromeUnmuteAll();
  }, []);

  const closeDuplicates = useCallback(async () => {
    return await chromeCloseDuplicates();
  }, []);

  const reorderTab = useCallback(async (tabId, windowId, newIndex) => {
    await chromeMoveTab(tabId, windowId, newIndex);
  }, []);

  const closeOtherTabs = useCallback(async (tabId, windowId) => {
    const win = windows.find(w => w.id === windowId);
    if (!win) return;
    const toClose = win.tabs.filter(t => t.id !== tabId).map(t => t.id);
    for (const id of toClose) await chromeCloseTab(id);
  }, [windows]);

  const closeTabsToRight = useCallback(async (tabId, windowId) => {
    const win = windows.find(w => w.id === windowId);
    if (!win) return;
    const idx = win.tabs.findIndex(t => t.id === tabId);
    const toClose = win.tabs.slice(idx + 1).map(t => t.id);
    for (const id of toClose) await chromeCloseTab(id);
  }, [windows]);

  const suspendTab = useCallback(async (tabId) => {
    await chromeDiscardTab(tabId);
    setSuspendedTabs(prev => new Set([...prev, tabId]));
  }, []);

  const unsuspendTab = useCallback(async (tabId) => {
    const tab = allTabs.find(t => t.id === tabId);
    if (tab) await chromeSwitchToTab(tabId, tab.windowId);
    setSuspendedTabs(prev => { const n = new Set(prev); n.delete(tabId); return n; });
  }, [allTabs]);

  const suspendInactive = useCallback(async () => {
    const toSuspend = [];
    windows.forEach(w => w.tabs?.forEach(t => {
      if (!t.active && !t.pinned && !t.audible) toSuspend.push(t.id);
    }));
    for (const id of toSuspend) await chromeDiscardTab(id);
    setSuspendedTabs(new Set(toSuspend));
    return toSuspend.length;
  }, [windows]);

  const unsuspendAll = useCallback(() => {
    const count = suspendedTabs.size;
    setSuspendedTabs(new Set());
    return count;
  }, [suspendedTabs]);

  const setTabNote = useCallback((tabId, note) => {
    setTabNotes(prev => {
      const updated = { ...prev };
      if (!note || !note.trim()) delete updated[tabId];
      else updated[tabId] = note.trim();
      chromeStorageSet({ tabNotes: updated });
      return updated;
    });
  }, []);

  return {
    windows: windowsWithNames, tabGroups, allTabs, suspendedTabs, tabNotes,
    switchToTab, closeTab, undoCloseTab, pinTab, muteTab, duplicateTab,
    moveTab, moveTabToNewWindow, closeWindow, minimizeWindow,
    createNewTab, createTabInWindow, createNewWindow, renameWindow,
    muteAll, unmuteAll, closeDuplicates,
    reorderTab, closeOtherTabs, closeTabsToRight,
    suspendTab, unsuspendTab, suspendInactive, unsuspendAll,
    setTabNote, refresh,
  };
}
