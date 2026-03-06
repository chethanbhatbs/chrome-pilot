import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tabpilot_sessions';

function loadSessions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useSessions() {
  const [sessions, setSessions] = useState(loadSessions);

  const saveSession = useCallback((name, windows) => {
    const session = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      savedAt: new Date().toISOString(),
      windowCount: windows.length,
      tabCount: windows.reduce((sum, w) => sum + w.tabs.length, 0),
      windows: windows.map(w => ({
        tabs: w.tabs.map(t => ({ url: t.url, title: t.title, pinned: t.pinned }))
      }))
    };
    setSessions(prev => {
      const updated = [session, ...prev];
      persistSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      persistSessions(updated);
      return updated;
    });
  }, []);

  return { sessions, saveSession, deleteSession };
}
