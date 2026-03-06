import { useState, useCallback, useMemo } from 'react';
import { MOCK_WINDOWS, MOCK_TAB_GROUPS } from '@/utils/mockData';

let nextTabId = 400;
let nextWindowId = 4;

export function useMockTabs() {
  const [windows, setWindows] = useState(MOCK_WINDOWS);
  const [tabGroups] = useState(MOCK_TAB_GROUPS);

  const allTabs = useMemo(() =>
    windows.flatMap(w => w.tabs.map(t => ({ ...t, windowId: w.id }))),
    [windows]
  );

  const switchToTab = useCallback((tabId) => {
    setWindows(prev => prev.map(w => ({
      ...w,
      focused: w.tabs.some(t => t.id === tabId),
      tabs: w.tabs.map(t => ({ ...t, active: t.id === tabId }))
    })));
  }, []);

  const closeTab = useCallback((tabId) => {
    setWindows(prev => {
      const updated = prev.map(w => ({
        ...w,
        tabs: w.tabs.filter(t => t.id !== tabId)
      }));
      return updated.filter(w => w.tabs.length > 0);
    });
  }, []);

  const pinTab = useCallback((tabId) => {
    setWindows(prev => prev.map(w => ({
      ...w,
      tabs: w.tabs.map(t =>
        t.id === tabId ? { ...t, pinned: !t.pinned } : t
      )
    })));
  }, []);

  const muteTab = useCallback((tabId) => {
    setWindows(prev => prev.map(w => ({
      ...w,
      tabs: w.tabs.map(t =>
        t.id === tabId
          ? { ...t, mutedInfo: { muted: !t.mutedInfo.muted }, audible: t.mutedInfo.muted ? t.audible : false }
          : t
      )
    })));
  }, []);

  const duplicateTab = useCallback((tabId) => {
    setWindows(prev => prev.map(w => {
      const tab = w.tabs.find(t => t.id === tabId);
      if (!tab) return w;
      const newTab = { ...tab, id: nextTabId++, active: false, pinned: false };
      const idx = w.tabs.findIndex(t => t.id === tabId);
      const newTabs = [...w.tabs];
      newTabs.splice(idx + 1, 0, newTab);
      return { ...w, tabs: newTabs };
    }));
  }, []);

  const moveTab = useCallback((tabId, targetWindowId, index = -1) => {
    setWindows(prev => {
      let movedTab = null;
      let updated = prev.map(w => {
        const tab = w.tabs.find(t => t.id === tabId);
        if (tab) {
          movedTab = { ...tab, windowId: targetWindowId, active: false };
          return { ...w, tabs: w.tabs.filter(t => t.id !== tabId) };
        }
        return w;
      });
      if (!movedTab) return prev;
      updated = updated.map(w => {
        if (w.id === targetWindowId) {
          const newTabs = [...w.tabs];
          if (index === -1) newTabs.push(movedTab);
          else newTabs.splice(index, 0, movedTab);
          return { ...w, tabs: newTabs };
        }
        return w;
      });
      return updated.filter(w => w.tabs.length > 0);
    });
  }, []);

  const moveTabToNewWindow = useCallback((tabId) => {
    setWindows(prev => {
      let movedTab = null;
      let updated = prev.map(w => {
        const tab = w.tabs.find(t => t.id === tabId);
        if (tab) {
          movedTab = { ...tab };
          return { ...w, tabs: w.tabs.filter(t => t.id !== tabId) };
        }
        return w;
      });
      if (!movedTab) return prev;
      const newWindowId = nextWindowId++;
      movedTab.windowId = newWindowId;
      movedTab.active = true;
      updated.push({ id: newWindowId, focused: true, state: 'normal', tabs: [movedTab] });
      updated = updated.map(w => ({ ...w, focused: w.id === newWindowId }));
      return updated.filter(w => w.tabs.length > 0);
    });
  }, []);

  const closeWindow = useCallback((windowId) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
  }, []);

  const minimizeWindow = useCallback((windowId) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, state: w.state === 'minimized' ? 'normal' : 'minimized' } : w
    ));
  }, []);

  const createNewTab = useCallback(() => {
    setWindows(prev => {
      const focusedWindow = prev.find(w => w.focused) || prev[0];
      if (!focusedWindow) return prev;
      const newTab = {
        id: nextTabId++, windowId: focusedWindow.id,
        index: focusedWindow.tabs.length,
        title: 'New Tab', url: 'chrome://newtab',
        active: true, pinned: false, audible: false,
        mutedInfo: { muted: false }, status: 'complete', groupId: -1,
      };
      return prev.map(w => {
        if (w.id === focusedWindow.id) {
          return { ...w, tabs: [...w.tabs.map(t => ({ ...t, active: false })), newTab] };
        }
        return { ...w, tabs: w.tabs.map(t => ({ ...t, active: false })) };
      });
    });
  }, []);

  const createNewWindow = useCallback(() => {
    const newWinId = nextWindowId++;
    const newTab = {
      id: nextTabId++, windowId: newWinId, index: 0,
      title: 'New Tab', url: 'chrome://newtab',
      active: true, pinned: false, audible: false,
      mutedInfo: { muted: false }, status: 'complete', groupId: -1,
    };
    setWindows(prev => [
      ...prev.map(w => ({ ...w, focused: false })),
      { id: newWinId, focused: true, state: 'normal', tabs: [newTab] }
    ]);
  }, []);

  const muteAll = useCallback(() => {
    setWindows(prev => prev.map(w => ({
      ...w,
      tabs: w.tabs.map(t =>
        t.audible ? { ...t, mutedInfo: { muted: true }, audible: false } : t
      )
    })));
  }, []);

  const closeDuplicates = useCallback(() => {
    const urlMap = {};
    const tabsToClose = [];
    windows.forEach(w => {
      w.tabs.forEach(t => {
        try {
          const u = new URL(t.url);
          const normalized = u.origin + u.pathname.replace(/\/$/, '') + u.search;
          if (urlMap[normalized]) tabsToClose.push(t.id);
          else urlMap[normalized] = t.id;
        } catch { /* skip */ }
      });
    });
    if (tabsToClose.length === 0) return 0;
    setWindows(prev => {
      const updated = prev.map(w => ({
        ...w, tabs: w.tabs.filter(t => !tabsToClose.includes(t.id))
      }));
      return updated.filter(w => w.tabs.length > 0);
    });
    return tabsToClose.length;
  }, [windows]);

  const reorderTab = useCallback((tabId, windowId, newIndex) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== windowId) return w;
      const tabIdx = w.tabs.findIndex(t => t.id === tabId);
      if (tabIdx === -1) return w;
      const newTabs = [...w.tabs];
      const [tab] = newTabs.splice(tabIdx, 1);
      newTabs.splice(newIndex, 0, tab);
      return { ...w, tabs: newTabs };
    }));
  }, []);

  const closeOtherTabs = useCallback((tabId, windowId) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, tabs: w.tabs.filter(t => t.id === tabId) } : w
    ));
  }, []);

  const closeTabsToRight = useCallback((tabId, windowId) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== windowId) return w;
      const idx = w.tabs.findIndex(t => t.id === tabId);
      return { ...w, tabs: w.tabs.slice(0, idx + 1) };
    }));
  }, []);

  return {
    windows, tabGroups, allTabs,
    switchToTab, closeTab, pinTab, muteTab, duplicateTab,
    moveTab, moveTabToNewWindow, closeWindow, minimizeWindow,
    createNewTab, createNewWindow, muteAll, closeDuplicates,
    reorderTab, closeOtherTabs, closeTabsToRight
  };
}
