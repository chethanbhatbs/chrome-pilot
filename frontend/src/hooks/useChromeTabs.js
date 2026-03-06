import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  isExtensionContext, chromeGetAllWindows, chromeGetTabGroups,
  chromeSwitchToTab, chromeCloseTab, chromePinTab, chromeMuteTab,
  chromeDuplicateTab, chromeMoveTab, chromeMoveTabToNewWindow,
  chromeCreateNewTab, chromeCreateNewWindow, chromeCloseWindow,
  chromeMinimizeWindow, chromeMuteAll, chromeUnmuteAll, chromeCloseDuplicates,
  chromeDiscardTab, chromeOnTabsUpdated
} from '@/utils/chromeAdapter';
import { INITIAL_TAB_NOTES } from '@/utils/mockData';

/**
 * Hook that connects to real Chrome APIs when running as extension,
 * otherwise falls back to mock data via useMockTabs.
 */
export function useChromeTabs() {
  const [windows, setWindows] = useState([]);
  const [tabGroups, setTabGroups] = useState([]);
  const [suspendedTabs, setSuspendedTabs] = useState(new Set());
  const [tabNotes, setTabNotes] = useState(INITIAL_TAB_NOTES);
  const refreshRef = useRef(null);

  const refresh = useCallback(async () => {
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
    refresh();
    // Listen for tab changes
    const cleanup = chromeOnTabsUpdated(() => refreshRef.current?.());
    // Poll every 2s as safety net
    const interval = setInterval(() => refreshRef.current?.(), 2000);
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [refresh]);

  const allTabs = useMemo(() =>
    windows.flatMap(w => (w.tabs || []).map(t => ({ ...t, windowId: w.id }))),
    [windows]
  );

  const switchToTab = useCallback(async (tabId) => {
    const tab = allTabs.find(t => t.id === tabId);
    await chromeSwitchToTab(tabId, tab?.windowId);
  }, [allTabs]);

  const closeTab = useCallback(async (tabId) => {
    await chromeCloseTab(tabId);
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
    await chromeMinimizeWindow(windowId);
  }, []);

  const createNewTab = useCallback(async () => {
    const focused = windows.find(w => w.focused);
    await chromeCreateNewTab(focused?.id);
  }, [windows]);

  const createNewWindow = useCallback(async () => {
    await chromeCreateNewWindow();
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
    // Switching to a discarded tab reloads it
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
      if (!note || !note.trim()) {
        const next = { ...prev };
        delete next[tabId];
        return next;
      }
      return { ...prev, [tabId]: note.trim() };
    });
  }, []);

  return {
    windows, tabGroups, allTabs, suspendedTabs, tabNotes,
    switchToTab, closeTab, pinTab, muteTab, duplicateTab,
    moveTab, moveTabToNewWindow, closeWindow, minimizeWindow,
    createNewTab, createNewWindow, muteAll, unmuteAll, closeDuplicates,
    reorderTab, closeOtherTabs, closeTabsToRight,
    suspendTab, unsuspendTab, suspendInactive, unsuspendAll,
    setTabNote, refresh,
  };
}
