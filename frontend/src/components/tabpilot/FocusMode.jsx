import { useState, useEffect, useMemo, useCallback } from 'react';
import { Focus, X, Timer, Check, ChevronRight, Monitor } from 'lucide-react';
import { getFaviconUrl, getDomain, handleFaviconError } from '@/utils/grouping';
import { chromeStorageGet, chromeStorageSet, isExtensionContext } from '@/utils/chromeAdapter';

const FOCUS_STORAGE_KEY = 'tabpilot_focus';

// Save focus state to chrome.storage so it persists across panel reloads / window switches
function persistFocusState(focusTabIds, hiddenTabIds, startTime) {
  if (!isExtensionContext()) return;
  chromeStorageSet({ [FOCUS_STORAGE_KEY]: {
    active: true,
    focusTabIds: [...focusTabIds],
    hiddenTabIds,
    startTime,
  }});
}

function clearFocusState() {
  if (!isExtensionContext()) return;
  chromeStorageSet({ [FOCUS_STORAGE_KEY]: null });
}

// Called from Sidebar on mount to check for persisted focus
export async function getPersistedFocus() {
  if (!isExtensionContext()) return null;
  const data = await chromeStorageGet([FOCUS_STORAGE_KEY]);
  const saved = data?.[FOCUS_STORAGE_KEY];
  if (saved?.active && saved.focusTabIds?.length > 0) return saved;
  return null;
}

export function FocusMode({ allTabs, windows, onSwitch, onExit, onHideTabs, onUnhideTabs, persistedFocus }) {
  const [focusTabIds, setFocusTabIds] = useState(() => {
    if (persistedFocus) return new Set(persistedFocus.focusTabIds);
    return new Set();
  });
  const [isActive, setIsActive] = useState(() => !!persistedFocus);
  const [elapsed, setElapsed] = useState(() => {
    if (persistedFocus?.startTime) return Math.floor((Date.now() - persistedFocus.startTime) / 1000);
    return 0;
  });
  const [hiddenTabIds, setHiddenTabIds] = useState(() => persistedFocus?.hiddenTabIds || []);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const toggleTab = useCallback((tabId) => {
    setFocusTabIds(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setFocusTabIds(new Set(allTabs.map(t => t.id)));
  }, [allTabs]);

  const deselectAll = useCallback(() => {
    setFocusTabIds(new Set());
  }, []);

  const toggleWindow = useCallback((windowTabs) => {
    setFocusTabIds(prev => {
      const next = new Set(prev);
      const allSelected = windowTabs.every(t => next.has(t.id));
      if (allSelected) {
        windowTabs.forEach(t => next.delete(t.id));
      } else {
        windowTabs.forEach(t => next.add(t.id));
      }
      return next;
    });
  }, []);

  const focusTabs = useMemo(() => {
    return allTabs.filter(t => focusTabIds.has(t.id));
  }, [allTabs, focusTabIds]);

  const handleStartFocus = async () => {
    const startTime = Date.now();
    setIsActive(true);
    setElapsed(0);
    // Hide non-focus tabs by grouping & collapsing them
    const toHide = allTabs.filter(t => !focusTabIds.has(t.id)).map(t => t.id);
    if (toHide.length > 0 && onHideTabs) {
      await onHideTabs(toHide);
      setHiddenTabIds(toHide);
    }
    // Persist so focus survives panel reloads / window switches
    persistFocusState(focusTabIds, toHide, startTime);
    // Switch to the first focused tab immediately
    const firstFocusTab = allTabs.find(t => focusTabIds.has(t.id));
    if (firstFocusTab) onSwitch(firstFocusTab.id);
  };

  const handleExitFocus = async () => {
    // Ungroup ALL "Hidden" groups — robust regardless of stale IDs
    if (onUnhideTabs) {
      await onUnhideTabs();
    }
    clearFocusState();
    setHiddenTabIds([]);
    setIsActive(false);
    setFocusTabIds(new Set());
    onExit();
  };

  // ── Active Focus Phase ──────────────────────────────────────────────
  if (isActive) {
    return (
      <div className="flex flex-col h-full" data-testid="focus-mode-panel">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 text-center">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 mb-2">
            <Focus size={18} className="text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-sm font-heading font-bold mb-0.5">Focus Mode</h2>
          <p className="text-[10px] text-muted-foreground">
            {focusTabs.length} tab{focusTabs.length !== 1 ? 's' : ''} in focus
          </p>
        </div>

        {/* Timer */}
        <div className="mx-4 mb-3 p-2.5 rounded-lg bg-card border border-border text-center">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-0.5">
            <Timer size={10} strokeWidth={1.5} />
            <span className="text-[9px] font-heading uppercase tracking-wider">Focus Time</span>
          </div>
          <span className="text-2xl font-mono font-bold text-foreground tracking-wider">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Focus tabs */}
        <div className="flex-1 overflow-y-auto px-2 min-h-0">
          <div className="space-y-0.5">
            {focusTabs.map(tab => (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer
                  hover:bg-[hsl(var(--hover-subtle))] transition-colors duration-150"
                onClick={() => onSwitch(tab.id)}
                data-testid={`focus-tab-${tab.id}`}
              >
                <img
                  src={getFaviconUrl(tab.url)}
                  alt=""
                  className="w-4 h-4 rounded-[3px] shrink-0"
                  onError={handleFaviconError}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-body truncate">{tab.title}</div>
                  <div className="text-[10px] text-muted-foreground/70 truncate">{getDomain(tab.url)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exit button */}
        <div className="p-3">
          <button
            data-testid="exit-focus-mode-btn"
            onClick={handleExitFocus}
            className="cursor-pointer w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-heading font-semibold
              rounded-lg border border-border text-muted-foreground hover:text-foreground
              hover:bg-[hsl(var(--hover-subtle))] transition-colors duration-150"
          >
            <X size={12} strokeWidth={1.5} />
            Exit Focus Mode
          </button>
        </div>
      </div>
    );
  }

  // ── Selection Phase ─────────────────────────────────────────────────
  const windowList = windows || [];

  return (
    <div className="flex flex-col h-full" data-testid="focus-mode-panel">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 text-center">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 mb-2">
          <Focus size={18} className="text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-sm font-heading font-bold mb-0.5">Focus Mode</h2>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Select the tabs you want to focus on. All other tabs will be hidden.
        </p>
      </div>

      {/* Select all / Deselect all */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[10px] text-muted-foreground font-body">
          {focusTabIds.size} of {allTabs.length} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="cursor-pointer text-[10px] text-primary hover:text-primary/80 font-heading font-semibold transition-colors"
            data-testid="focus-select-all"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground font-heading font-semibold transition-colors"
            data-testid="focus-deselect-all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tab list grouped by window */}
      <div className="flex-1 overflow-y-auto px-2">
        {windowList.map(win => {
          const winTabs = win.tabs || [];
          const allSelected = winTabs.length > 0 && winTabs.every(t => focusTabIds.has(t.id));
          const someSelected = winTabs.some(t => focusTabIds.has(t.id));

          return (
            <div key={win.id} className="mb-1" data-testid={`focus-window-${win.id}`}>
              {/* Window header with select-all */}
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer
                  hover:bg-[hsl(var(--hover-subtle))] transition-colors duration-150 rounded-md"
                onClick={() => toggleWindow(winTabs)}
              >
                <FocusCheckbox checked={allSelected} indeterminate={someSelected && !allSelected} />
                <Monitor size={11} className={win.focused ? 'text-primary' : 'text-muted-foreground/60'} strokeWidth={1.5} />
                <span className="text-[11px] font-heading font-semibold tracking-tight flex-1 truncate">
                  {win.name || 'Window'}
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-mono">{winTabs.length}</span>
              </div>

              {/* Tabs */}
              <div className="pl-4">
                {winTabs.map(tab => (
                  <div
                    key={tab.id}
                    className="flex items-center gap-2 px-2 py-[4px] cursor-pointer
                      hover:bg-[hsl(var(--hover-subtle))] transition-colors duration-150 rounded-sm"
                    onClick={() => toggleTab(tab.id)}
                    data-testid={`focus-select-tab-${tab.id}`}
                  >
                    <FocusCheckbox checked={focusTabIds.has(tab.id)} />
                    <img
                      src={getFaviconUrl(tab.url)}
                      alt=""
                      className="w-3.5 h-3.5 rounded-[2px] shrink-0"
                      onError={handleFaviconError}
                    />
                    <span className="text-[11px] font-body truncate flex-1 min-w-0">
                      {tab.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start / Cancel buttons */}
      <div className="p-3 space-y-1.5">
        <button
          data-testid="start-focus-btn"
          onClick={handleStartFocus}
          disabled={focusTabIds.size === 0}
          className="cursor-pointer w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-heading font-semibold
            rounded-lg bg-primary text-primary-foreground hover:bg-primary/90
            disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <Focus size={12} strokeWidth={1.5} />
          Start Focus ({focusTabIds.size})
        </button>
        <button
          data-testid="cancel-focus-btn"
          onClick={onExit}
          className="cursor-pointer w-full h-7 flex items-center justify-center text-[10px] font-heading
            text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function FocusCheckbox({ checked, indeterminate }) {
  return (
    <div
      className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-all duration-150
        ${checked
          ? 'bg-primary border-primary'
          : indeterminate
            ? 'bg-primary/30 border-primary/60'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50'
        }`}
    >
      {checked && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
      {indeterminate && !checked && (
        <div className="w-1.5 h-0.5 rounded-full bg-primary" />
      )}
    </div>
  );
}
