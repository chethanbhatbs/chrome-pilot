import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Settings, ArrowLeft, HelpCircle, StickyNote, Briefcase, Calendar, Timer, CheckSquare, X as XIcon, Check, Minus, Save, Trash2, Users } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchBar } from './SearchBar';
import { QuickActions } from './QuickActions';
import { WindowGroup } from './WindowGroup';
import { DomainView } from './DomainView';
import { DuplicatePanel, getDuplicateTabIds } from './DuplicatePanel';
import { SessionManager } from './SessionManager';
import { SettingsPanel } from './SettingsPanel';
import { HeatmapPanel } from './HeatmapPanel';
import { FocusMode, getPersistedFocus } from './FocusMode';
import { HelpPanel } from './HelpPanel';
import { CommandPalette } from './CommandPalette';
import { TabNotesPanel } from './TabNotesPanel';
import { WorkspaceManager } from './WorkspaceManager';
import { TabTimeline } from './TabTimeline';
import { AutoClosePanel } from './AutoClosePanel';
import { ProfilePanel } from './ProfilePanel';
import { StatsBar } from './StatsBar';
import { TourGuide, shouldShowTour } from './TourGuide';
import { isExtensionContext, chromeStorageGet, chromeStorageSet } from '@/utils/chromeAdapter';
import { useMockTabs } from '@/hooks/useMockTabs';
import { useChromeTabs } from '@/hooks/useChromeTabs';
import { useSearch } from '@/hooks/useSearch';
import { useSessions } from '@/hooks/useSessions';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

// Adaptive hook: both always called (React rules of hooks), Chrome one used in extension context
function useTabsAdapter() {
  const mockTabs = useMockTabs();
  const chromeTabs = useChromeTabs();
  return isExtensionContext() ? chromeTabs : mockTabs;
}

export function Sidebar({ onCollapse }) {
  const tabs = useTabsAdapter();
  const search = useSearch(tabs.allTabs);
  const { sessions, saveSession, deleteSession } = useSessions();
  const { settings, updateSetting } = useSettings();
  const searchInputRef = useRef(null);

  const [activePanel, setActivePanel] = useState(null);
  const [viewMode, setViewMode] = useState('window');
  const [selectedTabIdx, setSelectedTabIdx] = useState(-1);
  const [visitCounts, setVisitCounts] = useState({});
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [showTour, setShowTour] = useState(() => shouldShowTour());
  const [confirmPending, setConfirmPending] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState(new Set());
  const [activeWorkspace, setActiveWorkspace] = useState(null); // { id, name, tabIds }
  const [noteEditing, setNoteEditing] = useState(null); // { tabId, value }
  const [persistedFocus, setPersistedFocus] = useState(null); // restored from chrome.storage

  // On mount: check if focus mode was active (survives panel reload / window switch)
  useEffect(() => {
    getPersistedFocus().then(saved => {
      if (saved) {
        setPersistedFocus(saved);
        setActivePanel('focus');
      }
    });
  }, []);

  // Cross-window sync: listen for focus state changes from other windows
  useEffect(() => {
    if (!isExtensionContext() || !chrome?.storage?.onChanged) return;
    const handler = (changes) => {
      if (!changes.tabpilot_focus) return;
      const newVal = changes.tabpilot_focus.newValue;
      if (!newVal || !newVal.active) {
        // Focus was exited in another window — exit here too
        setPersistedFocus(null);
        if (activePanel === 'focus') setActivePanel(null);
      } else if (newVal.active && activePanel !== 'focus') {
        // Focus was started in another window — enter here too
        setPersistedFocus(newVal);
        setActivePanel('focus');
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [activePanel]);

  // On mount: restore active workspace from chrome.storage
  useEffect(() => {
    if (!isExtensionContext()) return;
    chromeStorageGet(['tabpilot_active_workspace']).then(data => {
      const saved = data?.tabpilot_active_workspace;
      if (saved?.id) {
        setActiveWorkspace({
          ...saved,
          tabIds: new Set(saved.tabIds || []),
        });
      }
    });
  }, []);

  // Cross-window sync: listen for workspace state changes from other windows
  useEffect(() => {
    if (!isExtensionContext() || !chrome?.storage?.onChanged) return;
    const handler = (changes) => {
      if (!changes.tabpilot_active_workspace) return;
      const newVal = changes.tabpilot_active_workspace.newValue;
      if (!newVal || !newVal.id) {
        setActiveWorkspace(null);
      } else {
        setActiveWorkspace({
          ...newVal,
          tabIds: new Set(newVal.tabIds || []),
        });
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const withConfirm = useCallback((message, action) => {
    if (!settings.confirmActions) { action(); return; }
    setConfirmPending({ message, action });
  }, [settings.confirmActions]);

  const handleActivateWorkspace = useCallback(async (id, name, tabIds) => {
    const workspaceTabSet = new Set(tabIds);
    // Hide non-workspace tabs in Chrome (group + collapse)
    const nonWorkspaceTabs = tabs.allTabs
      .filter(t => !workspaceTabSet.has(t.id) && !t.pinned) // can't group pinned tabs
      .map(t => t.id);
    const hiddenGroupId = await tabs.hideTabs(nonWorkspaceTabs);
    const wsState = { id, name, tabIds: workspaceTabSet, hiddenTabIds: nonWorkspaceTabs, hiddenGroupId };
    setActiveWorkspace(wsState);
    setActivePanel(null);
    // Persist to chrome.storage for cross-window sync
    if (isExtensionContext()) {
      chromeStorageSet({ tabpilot_active_workspace: {
        id, name, tabIds: [...workspaceTabSet], hiddenTabIds: nonWorkspaceTabs, hiddenGroupId,
      }});
    }
  }, [tabs]);

  const handleDeactivateWorkspace = useCallback(async () => {
    await tabs.unhideTabs();
    setActiveWorkspace(null);
    if (isExtensionContext()) {
      chromeStorageSet({ tabpilot_active_workspace: null });
    }
  }, [tabs]);

  // Hidden group IDs — filter these from display (focus mode / workspace isolation)
  const hiddenGroupIds = useMemo(() => {
    const ids = new Set();
    tabs.tabGroups.forEach(g => { if (g.title === 'Hidden') ids.add(g.id); });
    return ids;
  }, [tabs.tabGroups]);

  const isTabVisible = useCallback((t) => {
    return !t.groupId || t.groupId === -1 || !hiddenGroupIds.has(t.groupId);
  }, [hiddenGroupIds]);

  // Display-layer filtering: remove hidden group tabs, then apply workspace filter
  const filteredAllTabs = useMemo(() => {
    const visible = tabs.allTabs.filter(isTabVisible);
    if (!activeWorkspace) return visible;
    return visible.filter(t => activeWorkspace.tabIds.has(t.id));
  }, [tabs.allTabs, activeWorkspace, isTabVisible]);

  const filteredWindows = useMemo(() => {
    const visible = tabs.windows
      .map(w => ({ ...w, tabs: (w.tabs || []).filter(isTabVisible) }))
      .filter(w => w.tabs.length > 0);
    if (!activeWorkspace) return visible;
    return visible
      .map(w => ({ ...w, tabs: w.tabs.filter(t => activeWorkspace.tabIds.has(t.id)) }))
      .filter(w => w.tabs.length > 0);
  }, [tabs.windows, activeWorkspace, isTabVisible]);

  const duplicateTabIds = useMemo(() => getDuplicateTabIds(filteredAllTabs), [filteredAllTabs]);

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => !prev);
    setSelectedTabIds(new Set());
  }, []);

  const toggleTabSelection = useCallback((tabId) => {
    setSelectedTabIds(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  const selectAllTabs = useCallback(() => {
    setSelectedTabIds(new Set(filteredAllTabs.map(t => t.id)));
  }, [filteredAllTabs]);

  const deselectAllTabs = useCallback(() => {
    setSelectedTabIds(new Set());
  }, []);

  const selectAllInWindow = useCallback((windowId) => {
    const win = tabs.windows.find(w => w.id === windowId);
    if (!win) return;
    setSelectedTabIds(prev => {
      const next = new Set(prev);
      const winTabIds = win.tabs.map(t => t.id);
      const allSelected = winTabIds.every(id => next.has(id));
      if (allSelected) winTabIds.forEach(id => next.delete(id));
      else winTabIds.forEach(id => next.add(id));
      return next;
    });
  }, [tabs.windows]);

  const handleBulkClose = useCallback(() => {
    const count = selectedTabIds.size;
    selectedTabIds.forEach(id => tabs.closeTab(id));
    setSelectedTabIds(new Set());
    setSelectMode(false);
    toast.success(`Closed ${count} tab${count > 1 ? 's' : ''}`);
  }, [selectedTabIds, tabs]);

  const handleDuplicate = useCallback((tabId) => {
    tabs.duplicateTab(tabId);
    toast.success('Tab duplicated', { duration: 1500 });
  }, [tabs]);

  const handleSwitchTab = useCallback((tabId) => {
    tabs.switchToTab(tabId);
    setVisitCounts(prev => ({ ...prev, [tabId]: (prev[tabId] || 0) + 1 }));
    const tab = tabs.allTabs.find(t => t.id === tabId);
    if (tab) toast.info(`Switched to: ${tab.title}`, { duration: 1500 });
  }, [tabs]);

  const handleCloseTab = useCallback((tabId) => {
    const tabTitle = tabs.allTabs.find(t => t.id === tabId)?.title?.slice(0, 35) || 'Tab';
    withConfirm(`Close "${tabTitle}"?`, () => {
      tabs.closeTab(tabId);
      toast.success(`Closed: ${tabTitle}`, {
        duration: 3000,
        action: { label: 'Undo', onClick: () => tabs.undoCloseTab() },
      });
    });
  }, [tabs, withConfirm]);

  const handleCloseDuplicates = useCallback(async () => {
    const count = await tabs.closeDuplicates();
    if (count > 0) toast.success(`Closed ${count} duplicate tab${count > 1 ? 's' : ''}`);
    else toast.info('No duplicates found');
  }, [tabs]);

  const handleToggleGrouping = useCallback(() => {
    setViewMode(prev => prev === 'window' ? 'domain' : 'window');
    if (activePanel === 'heatmap' || activePanel === 'focus') setActivePanel(null);
  }, [activePanel]);

  const handleToggleHeatmap = useCallback(() => {
    setActivePanel(prev => prev === 'heatmap' ? null : 'heatmap');
    setViewMode('window');
  }, []);

  const handleToggleFocus = useCallback(() => {
    setActivePanel(prev => prev === 'focus' ? null : 'focus');
    setViewMode('window');
  }, []);

  const handleSuspendInactive = useCallback(() => {
    const count = tabs.suspendInactive();
    if (count > 0) toast.success(`Suspended ${count} inactive tab${count > 1 ? 's' : ''}`);
    else toast.info('No inactive tabs to suspend');
  }, [tabs]);

  const handleUnsuspendAll = useCallback(() => {
    const count = tabs.unsuspendAll();
    if (count > 0) toast.success(`Restored ${count} tab${count > 1 ? 's' : ''}`);
    else toast.info('No suspended tabs');
  }, [tabs]);

  const handleUnmuteAll = useCallback(() => {
    tabs.unmuteAll();
    toast.success('All tabs unmuted');
  }, [tabs]);

  const handleRestoreSession = useCallback(async (session) => {
    try {
      const count = await tabs.restoreSession(session);
      toast.success(`Restored from session "${session.name}" — ${count} tab${count !== 1 ? 's' : ''} opened`);
    } catch (e) {
      console.error('Restore session error:', e);
      toast.error('Failed to restore session');
    }
  }, [tabs]);

  const handleAddNote = useCallback((tabId) => {
    setNoteEditing({ tabId, value: tabs.tabNotes[tabId] || '' });
  }, [tabs]);

  const handleSaveNote = useCallback(() => {
    if (!noteEditing) return;
    tabs.setTabNote(noteEditing.tabId, noteEditing.value);
    if (noteEditing.value.trim()) toast.success('Note saved');
    else toast.info('Note removed');
    setNoteEditing(null);
  }, [noteEditing, tabs]);

  const quickActionHandlers = {
    onNewTab: () => withConfirm('Open a new tab?', tabs.createNewTab),
    onNewWindow: () => withConfirm('Open a new window?', tabs.createNewWindow),
    onCloseDuplicates: handleCloseDuplicates,
    onMuteAll: () => { tabs.muteAll(); toast.success('All tabs muted'); },
    onUnmuteAll: handleUnmuteAll,
    onToggleGrouping: handleToggleGrouping,
    onToggleHeatmap: handleToggleHeatmap,
    onToggleFocus: handleToggleFocus,
    onSuspendInactive: handleSuspendInactive,
    onUnsuspendAll: handleUnsuspendAll,
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
        return;
      }
      if (cmdPaletteOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedTabIdx(prev => Math.min(prev + 1, filteredAllTabs.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedTabIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedTabIdx >= 0) {
        const tab = tabs.allTabs[selectedTabIdx];
        if (tab) handleSwitchTab(tab.id);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTabIdx >= 0 && document.activeElement?.tagName !== 'INPUT') {
        const tab = tabs.allTabs[selectedTabIdx];
        if (tab) handleCloseTab(tab.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedTabIdx, tabs.allTabs, handleSwitchTab, handleCloseTab, cmdPaletteOpen, tabs]);

  const sharedTabProps = {
    showFavicons: settings.showFavicons,
    showUrls: settings.showUrls,
    compact: settings.compactMode,
    highlightText: search.query ? search.highlightText : null,
    matchingTabIds: search.matchingTabIds,
    windows: filteredWindows,
    suspendedTabs: tabs.suspendedTabs,
    tabNotes: tabs.tabNotes,
    duplicateTabIds,
    onSwitch: handleSwitchTab,
    onClose: handleCloseTab,
    onPin: tabs.pinTab,
    onMute: tabs.muteTab,
    onDuplicate: handleDuplicate,
    onMoveToWindow: tabs.moveTab,
    onMoveToNewWindow: tabs.moveTabToNewWindow,
    onCloseOthers: tabs.closeOtherTabs,
    onCloseToRight: tabs.closeTabsToRight,
    onReorderTab: tabs.reorderTab,
    onMoveTab: tabs.moveTab,
    onSuspend: tabs.suspendTab,
    onUnsuspend: tabs.unsuspendTab,
    onAddNote: handleAddNote,
    selectMode,
    selectedTabIds,
    onToggleSelect: toggleTabSelection,
    onSelectAllInWindow: selectAllInWindow,
  };

  const panelButtons = [
    { id: 'timeline', icon: Calendar, label: 'Timeline', panel: 'timeline' },
    { id: 'sessions', icon: Save, label: 'Sessions', panel: 'sessions' },
    { id: 'notes', icon: StickyNote, label: 'Notes', panel: 'notes' },
    { id: 'workspaces', icon: Briefcase, label: 'Workspaces', panel: 'workspaces' },
    { id: 'autoclose', icon: Timer, label: 'Auto-Close', panel: 'autoclose' },
    { id: 'profiles', icon: Users, label: 'Profiles', panel: 'profiles' },
    { id: 'help', icon: HelpCircle, label: 'Help', panel: 'help' },
    { id: 'settings', icon: Settings, label: 'Settings', panel: 'settings' },
  ];

  const showBackButton = ['settings', 'sessions', 'heatmap', 'help', 'notes', 'workspaces', 'timeline', 'autoclose', 'profiles'].includes(activePanel);

  if (activePanel === 'focus') {
    // When workspace is active, only show workspace tabs in focus mode
    const focusAllTabs = activeWorkspace ? filteredAllTabs : tabs.allTabs;
    const focusWindows = activeWorkspace ? filteredWindows : tabs.windows;
    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col h-full bg-background font-body" data-testid="sidebar">
          <FocusMode
            allTabs={focusAllTabs}
            windows={focusWindows}
            onSwitch={handleSwitchTab}
            onExit={() => { setActivePanel(null); setPersistedFocus(null); }}
            onHideTabs={tabs.hideTabs}
            onUnhideTabs={tabs.unhideTabs}
            persistedFocus={persistedFocus}
          />
          <StatsBar allTabs={focusAllTabs} suspendedCount={tabs.suspendedTabs.size} />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-background font-body" data-testid="sidebar">
        <CommandPalette allTabs={tabs.allTabs} onSwitch={handleSwitchTab} isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />

        {/* First-time tour */}
        {showTour && <TourGuide onComplete={() => setShowTour(false)} />}

        {/* Confirm action dialog */}
        {confirmPending && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50" onClick={() => setConfirmPending(null)}>
            <div
              className="bg-popover border border-border rounded-2xl p-5 shadow-2xl w-[280px] space-y-4 animate-slide-in"
              onClick={(e) => e.stopPropagation()}
              data-testid="confirm-dialog"
            >
              <p className="text-[13px] font-body text-foreground leading-relaxed">{confirmPending.message}</p>
              <div className="flex gap-2">
                <button
                  data-testid="confirm-action-btn"
                  onClick={() => { confirmPending.action(); setConfirmPending(null); }}
                  className="cursor-pointer flex-1 h-8 text-[11px] font-heading font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Confirm
                </button>
                <button
                  data-testid="cancel-action-btn"
                  onClick={() => setConfirmPending(null)}
                  className="cursor-pointer flex-1 h-8 text-[11px] font-heading text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-[hsl(var(--hover-subtle))] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-2 pt-2 pb-1 space-y-1 bg-background/90 backdrop-blur-md sticky top-0 z-10" data-testid="sidebar-header">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-heading font-bold tracking-tight px-1 shrink-0 brand-text">
              TabPilot
            </span>
            <div className="flex-1 min-w-0">
              <SearchBar
                query={search.query} setQuery={search.setQuery}
                resultCount={search.resultCount} clearSearch={search.clearSearch}
                inputRef={searchInputRef} suggestions={search.suggestions}
                onSwitchTab={handleSwitchTab}
              />
            </div>
            {panelButtons.map(({ id, icon: Icon, label, panel }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    data-testid={`${id}-toggle-btn`}
                    onClick={() => setActivePanel(activePanel === panel ? null : panel)}
                    className={`cursor-pointer p-1.5 rounded-md transition-all duration-150
                      ${activePanel === panel
                        ? 'text-primary bg-primary/15'
                        : 'text-foreground/50 hover:text-foreground hover:bg-[hsl(var(--hover-medium))]'
                      } active:scale-95`}
                  >
                    <Icon size={13} strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-body">{label}</TooltipContent>
              </Tooltip>
            ))}
            {/* Collapse — only in web preview mode (sidePanel has no collapse API) */}
            {onCollapse && !isExtensionContext() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid="collapse-sidebar-btn"
                    onClick={() => onCollapse()}
                    className="p-1.5 rounded-md transition-all duration-150 text-foreground/50 hover:text-foreground hover:bg-[hsl(var(--hover-medium))] active:scale-95"
                  >
                    <ArrowLeft size={13} strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-body">Collapse sidebar</TooltipContent>
              </Tooltip>
            )}
          </div>
          {/* Only show toolbar when viewing tabs (no active panel or heatmap/focus which are tab-related) */}
          {(!activePanel || activePanel === 'heatmap' || activePanel === 'focus') && (
            <QuickActions handlers={quickActionHandlers} viewMode={viewMode} activePanel={activePanel}
              selectMode={selectMode} onToggleSelectMode={toggleSelectMode} />
          )}
        </div>

        {/* Bulk action bar */}
        {selectMode && (
          <div className="px-2.5 py-1.5 bg-primary/[0.08] border-b border-primary/20 flex items-center gap-2.5" data-testid="bulk-action-bar">
            {/* Select all / deselect all checkbox */}
            <button
              onClick={selectedTabIds.size === filteredAllTabs.length ? deselectAllTabs : selectAllTabs}
              className="cursor-pointer shrink-0"
              data-testid="select-all-checkbox"
              title={selectedTabIds.size === filteredAllTabs.length ? 'Deselect all' : 'Select all'}
            >
              <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all duration-150
                ${selectedTabIds.size === filteredAllTabs.length
                  ? 'bg-primary border-primary'
                  : selectedTabIds.size > 0
                    ? 'bg-primary/30 border-primary/60'
                    : 'border-muted-foreground/40 hover:border-muted-foreground/60'
                }`}
              >
                {selectedTabIds.size === filteredAllTabs.length && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
                {selectedTabIds.size > 0 && selectedTabIds.size < filteredAllTabs.length && <Minus size={10} className="text-primary" strokeWidth={3} />}
              </div>
            </button>
            <span className="text-[11px] font-heading font-semibold text-foreground/80 flex-1">
              {selectedTabIds.size} selected
            </span>
            {selectedTabIds.size > 0 && (
              <button
                onClick={deselectAllTabs}
                className="cursor-pointer flex items-center gap-1 text-[10px] font-heading font-semibold text-muted-foreground hover:text-foreground
                  transition-colors px-2 py-1 rounded-md hover:bg-[hsl(var(--hover-medium))]"
                data-testid="clear-selection-btn"
              >
                <XIcon size={10} strokeWidth={2} />
                Clear
              </button>
            )}
            <button
              onClick={handleBulkClose}
              disabled={selectedTabIds.size === 0}
              className="cursor-pointer flex items-center gap-1 text-[10px] font-heading font-semibold text-destructive hover:text-destructive/80
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md bg-destructive/10 hover:bg-destructive/15"
              data-testid="bulk-close-btn"
            >
              <Trash2 size={11} strokeWidth={2} />
              Close {selectedTabIds.size}
            </button>
          </div>
        )}

        {/* Back button — always visible outside scroll area */}
        {showBackButton && (
          <button
            data-testid={`back-from-${activePanel}`}
            onClick={() => setActivePanel(null)}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full border-b border-border/30 bg-background"
          >
            <ArrowLeft size={10} strokeWidth={1.5} /> Back to tabs
          </button>
        )}

        {/* Workspace active banner */}
        {activeWorkspace && !activePanel && (
          <div className="px-2.5 py-1.5 bg-primary/[0.08] border-b border-primary/20 flex items-center justify-between" data-testid="workspace-active-banner">
            <div className="flex items-center gap-1.5">
              <Briefcase size={11} className="text-primary" strokeWidth={2} />
              <span className="text-[10px] font-heading font-semibold text-primary">
                {activeWorkspace.name}
              </span>
              <span className="text-[9px] text-muted-foreground/60 font-mono">
                {filteredAllTabs.length} tab{filteredAllTabs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={handleDeactivateWorkspace}
              className="cursor-pointer flex items-center gap-1 text-[9px] font-heading text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-[hsl(var(--hover-medium))]"
              data-testid="deactivate-workspace-btn"
            >
              <XIcon size={9} strokeWidth={2} /> Exit
            </button>
          </div>
        )}

        {/* Inline note editor */}
        {noteEditing && (
          <div className="px-2.5 py-2 bg-primary/[0.04] border-b border-primary/20 space-y-1.5" data-testid="inline-note-editor">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-heading font-semibold text-foreground/80">
                Note for: {tabs.allTabs.find(t => t.id === noteEditing.tabId)?.title?.slice(0, 30) || 'Tab'}
              </span>
              <button onClick={() => setNoteEditing(null)} className="cursor-pointer p-0.5 text-muted-foreground/50 hover:text-foreground">
                <XIcon size={10} strokeWidth={2} />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={noteEditing.value}
              onChange={(e) => setNoteEditing(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNote(); if (e.key === 'Escape') setNoteEditing(null); }}
              placeholder="Type a note..."
              className="w-full h-7 px-2 text-[11px] font-body bg-background border border-border rounded-md
                text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              data-testid="note-input"
            />
            <div className="flex gap-1">
              <button onClick={handleSaveNote}
                className="cursor-pointer flex-1 h-6 text-[10px] font-heading font-semibold rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Save
              </button>
              {noteEditing.value && (
                <button onClick={() => { setNoteEditing(prev => ({ ...prev, value: '' })); }}
                  className="cursor-pointer h-6 px-2 text-[10px] rounded text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="w-full pr-1.5" data-testid="sidebar-scroll-content">
          {activePanel === 'settings' ? (
            <div className="animate-panel-enter"><SettingsPanel settings={settings} onUpdate={updateSetting} /></div>
          ) : activePanel === 'sessions' ? (
            <div className="animate-panel-enter">
              <SessionManager sessions={sessions} onSave={saveSession} onDelete={deleteSession} onRestore={handleRestoreSession} windows={tabs.windows} />
            </div>
          ) : activePanel === 'heatmap' ? (
            <div className="animate-panel-enter">
              <HeatmapPanel allTabs={tabs.allTabs} onSwitch={handleSwitchTab} selectMode={selectMode} selectedTabIds={selectedTabIds} onToggleSelect={toggleTabSelection} />
            </div>
          ) : activePanel === 'help' ? (
            <div className="animate-panel-enter"><HelpPanel onBack={() => setActivePanel(null)} /></div>
          ) : activePanel === 'notes' ? (
            <div className="animate-panel-enter">
              <TabNotesPanel allTabs={tabs.allTabs} tabNotes={tabs.tabNotes} onSetNote={tabs.setTabNote} onSwitch={handleSwitchTab} />
            </div>
          ) : activePanel === 'workspaces' ? (
            <div className="animate-panel-enter">
              <WorkspaceManager
                allTabs={tabs.allTabs}
                onSwitch={handleSwitchTab}
                activeWorkspaceId={activeWorkspace?.id}
                onActivateWorkspace={handleActivateWorkspace}
                onDeactivateWorkspace={handleDeactivateWorkspace}
              />
            </div>
          ) : activePanel === 'timeline' ? (
            <div className="animate-panel-enter"><TabTimeline /></div>
          ) : activePanel === 'autoclose' ? (
            <div className="animate-panel-enter">
              <AutoClosePanel allTabs={filteredAllTabs} onClose={handleCloseTab} settings={settings} onUpdateSetting={updateSetting} visitCounts={visitCounts} />
            </div>
          ) : activePanel === 'profiles' ? (
            <div className="animate-panel-enter"><ProfilePanel /></div>
          ) : (
            <div>
              {viewMode === 'window' ? (
                filteredWindows.map(win => (
                  <WindowGroup
                    key={win.id} window={win} tabGroups={tabs.tabGroups}
                    onCloseWindow={(winId) => {
                      // Always confirm window close regardless of settings
                      setConfirmPending({ message: 'Close this window and all its tabs?', action: () => tabs.closeWindow(winId) });
                    }}
                    onMinimizeWindow={tabs.minimizeWindow}
                    onCreateTabInWindow={tabs.createTabInWindow}
                    onRenameWindow={tabs.renameWindow}
                    {...sharedTabProps}
                  />
                ))
              ) : (
                <DomainView allTabs={filteredAllTabs} {...sharedTabProps} />
              )}
              {!activeWorkspace && (
                <DuplicatePanel allTabs={filteredAllTabs} onCloseDuplicates={handleCloseDuplicates} onCloseTab={handleCloseTab} />
              )}
            </div>
          )}
          </div>
        </ScrollArea>

        <StatsBar allTabs={filteredAllTabs} suspendedCount={tabs.suspendedTabs.size} />
      </div>
    </TooltipProvider>
  );
}
