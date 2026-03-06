import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Settings, ArrowLeft, HelpCircle, StickyNote, Briefcase, Calendar, Timer } from 'lucide-react';
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
import { FocusMode } from './FocusMode';
import { HelpPanel } from './HelpPanel';
import { CommandPalette } from './CommandPalette';
import { TabNotesPanel } from './TabNotesPanel';
import { WorkspaceManager } from './WorkspaceManager';
import { TabTimeline } from './TabTimeline';
import { AutoClosePanel } from './AutoClosePanel';
import { TabPreview, useTabPreview } from './TabPreview';
import { StatsBar } from './StatsBar';
import { isExtensionContext } from '@/utils/chromeAdapter';
import { useMockTabs } from '@/hooks/useMockTabs';
import { useSearch } from '@/hooks/useSearch';
import { useSessions } from '@/hooks/useSessions';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

// Dynamically pick the right hook
function useTabsAdapter() {
  // Always use mock in web preview; the Chrome hook is for the extension sidepanel only
  return useMockTabs();
}

export function Sidebar() {
  const tabs = useTabsAdapter();
  const search = useSearch(tabs.allTabs);
  const { sessions, saveSession, deleteSession } = useSessions();
  const { settings, updateSetting } = useSettings();
  const searchInputRef = useRef(null);
  const { preview, showPreview, hidePreview } = useTabPreview();

  const [activePanel, setActivePanel] = useState(null);
  const [viewMode, setViewMode] = useState('window');
  const [selectedTabIdx, setSelectedTabIdx] = useState(-1);
  const [visitCounts, setVisitCounts] = useState({});
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  const duplicateTabIds = useMemo(() => getDuplicateTabIds(tabs.allTabs), [tabs.allTabs]);

  const handleSwitchTab = useCallback((tabId) => {
    hidePreview();
    tabs.switchToTab(tabId);
    setVisitCounts(prev => ({ ...prev, [tabId]: (prev[tabId] || 0) + 1 }));
    const tab = tabs.allTabs.find(t => t.id === tabId);
    if (tab) toast.info(`Switched to: ${tab.title}`, { duration: 1500 });
  }, [tabs, hidePreview]);

  const handleCloseTab = useCallback((tabId) => {
    tabs.closeTab(tabId);
    toast.success('Tab closed', { duration: 1000 });
  }, [tabs]);

  const handleCloseDuplicates = useCallback(() => {
    const count = tabs.closeDuplicates();
    if (count > 0) toast.success(`Closed ${count} duplicate tab${count > 1 ? 's' : ''}`);
    else toast.info('No duplicates found');
  }, [tabs]);

  const handleSaveSession = useCallback(() => {
    setActivePanel(activePanel === 'sessions' ? null : 'sessions');
  }, [activePanel]);

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

  const handleRestoreSession = useCallback((session) => {
    toast.info(`Session "${session.name}" restored (${session.tabCount} tabs)`);
  }, []);

  const handleAddNote = useCallback((tabId) => {
    const note = prompt('Add a note for this tab:', tabs.tabNotes[tabId] || '');
    if (note !== null) {
      tabs.setTabNote(tabId, note);
      if (note.trim()) toast.success('Note saved');
      else toast.info('Note removed');
    }
  }, [tabs]);

  const handleHoverEnter = useCallback((tab, event) => {
    showPreview(tab, event, {
      suspended: tabs.suspendedTabs.has(tab.id),
      tabNote: tabs.tabNotes[tab.id],
    });
  }, [showPreview, tabs.suspendedTabs, tabs.tabNotes]);

  const quickActionHandlers = {
    onNewTab: tabs.createNewTab,
    onNewWindow: tabs.createNewWindow,
    onCloseDuplicates: handleCloseDuplicates,
    onMuteAll: () => { tabs.muteAll(); toast.success('All tabs muted'); },
    onUnmuteAll: handleUnmuteAll,
    onSaveSession: handleSaveSession,
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
        setSelectedTabIdx(prev => Math.min(prev + 1, tabs.allTabs.length - 1));
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
  }, [selectedTabIdx, tabs.allTabs, handleSwitchTab, handleCloseTab, cmdPaletteOpen]);

  const sharedTabProps = {
    showFavicons: settings.showFavicons,
    showUrls: settings.showUrls,
    compact: settings.compactMode,
    highlightText: search.query ? search.highlightText : null,
    matchingTabIds: search.matchingTabIds,
    windows: tabs.windows,
    suspendedTabs: tabs.suspendedTabs,
    tabNotes: tabs.tabNotes,
    duplicateTabIds,
    onSwitch: handleSwitchTab,
    onClose: handleCloseTab,
    onPin: tabs.pinTab,
    onMute: tabs.muteTab,
    onDuplicate: tabs.duplicateTab,
    onMoveToWindow: tabs.moveTab,
    onMoveToNewWindow: tabs.moveTabToNewWindow,
    onCloseOthers: tabs.closeOtherTabs,
    onCloseToRight: tabs.closeTabsToRight,
    onReorderTab: tabs.reorderTab,
    onMoveTab: tabs.moveTab,
    onSuspend: tabs.suspendTab,
    onUnsuspend: tabs.unsuspendTab,
    onAddNote: handleAddNote,
    onHoverEnter: handleHoverEnter,
    onHoverLeave: hidePreview,
  };

  const panelButtons = [
    { id: 'timeline', icon: Calendar, label: 'Timeline', panel: 'timeline' },
    { id: 'notes', icon: StickyNote, label: 'Notes', panel: 'notes' },
    { id: 'workspaces', icon: Briefcase, label: 'Workspaces', panel: 'workspaces' },
    { id: 'autoclose', icon: Timer, label: 'Auto-Close', panel: 'autoclose' },
    { id: 'help', icon: HelpCircle, label: 'Help', panel: 'help' },
    { id: 'settings', icon: Settings, label: 'Settings', panel: 'settings' },
  ];

  const showBackButton = ['settings', 'sessions', 'heatmap', 'help', 'notes', 'workspaces', 'timeline', 'autoclose'].includes(activePanel);

  if (activePanel === 'focus') {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col h-full bg-background font-body" data-testid="sidebar">
          <FocusMode allTabs={tabs.allTabs} visitCounts={visitCounts} onSwitch={handleSwitchTab} onExit={() => setActivePanel(null)} />
          <StatsBar windows={tabs.windows} allTabs={tabs.allTabs} suspendedCount={tabs.suspendedTabs.size} />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-background font-body" data-testid="sidebar">
        <CommandPalette allTabs={tabs.allTabs} onSwitch={handleSwitchTab} isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />

        {/* Tab Preview tooltip */}
        {preview && (
          <TabPreview
            tab={preview.tab}
            suspended={preview.suspended}
            tabNote={preview.tabNote}
            anchorRect={preview.anchorRect}
            onClose={hidePreview}
          />
        )}

        {/* Header */}
        <div className="px-2 pt-2 pb-1 space-y-1 bg-background/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-heading font-bold text-primary tracking-tight px-1 shrink-0">TabPilot</span>
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
                    className={`p-1.5 rounded-md transition-all duration-150
                      ${activePanel === panel
                        ? 'text-primary bg-primary/15'
                        : 'text-foreground/50 hover:text-foreground hover:bg-white/[0.08]'
                      } active:scale-95`}
                  >
                    <Icon size={13} strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-body">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <QuickActions handlers={quickActionHandlers} viewMode={viewMode} activePanel={activePanel} />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {showBackButton && (
            <button
              data-testid={`back-from-${activePanel}`}
              onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ArrowLeft size={10} strokeWidth={1.5} /> Back to tabs
            </button>
          )}

          {activePanel === 'settings' ? (
            <div className="animate-slide-in"><SettingsPanel settings={settings} onUpdate={updateSetting} /></div>
          ) : activePanel === 'sessions' ? (
            <div className="animate-slide-in">
              <SessionManager sessions={sessions} onSave={saveSession} onDelete={deleteSession} onRestore={handleRestoreSession} windows={tabs.windows} />
            </div>
          ) : activePanel === 'heatmap' ? (
            <div className="animate-slide-in">
              <HeatmapPanel allTabs={tabs.allTabs} visitCounts={visitCounts} onSwitch={handleSwitchTab} />
            </div>
          ) : activePanel === 'help' ? (
            <div className="animate-slide-in"><HelpPanel onBack={() => setActivePanel(null)} /></div>
          ) : activePanel === 'notes' ? (
            <div className="animate-slide-in">
              <TabNotesPanel allTabs={tabs.allTabs} tabNotes={tabs.tabNotes} onSetNote={tabs.setTabNote} onSwitch={handleSwitchTab} />
            </div>
          ) : activePanel === 'workspaces' ? (
            <div className="animate-slide-in">
              <WorkspaceManager allTabs={tabs.allTabs} onSwitch={handleSwitchTab} />
            </div>
          ) : activePanel === 'timeline' ? (
            <div className="animate-slide-in"><TabTimeline /></div>
          ) : activePanel === 'autoclose' ? (
            <div className="animate-slide-in">
              <AutoClosePanel allTabs={tabs.allTabs} onClose={handleCloseTab} />
            </div>
          ) : (
            <div>
              {viewMode === 'window' ? (
                tabs.windows.map(win => (
                  <WindowGroup
                    key={win.id} window={win} tabGroups={tabs.tabGroups}
                    onCloseWindow={tabs.closeWindow} onMinimizeWindow={tabs.minimizeWindow}
                    {...sharedTabProps}
                  />
                ))
              ) : (
                <DomainView allTabs={tabs.allTabs} {...sharedTabProps} />
              )}
              <DuplicatePanel allTabs={tabs.allTabs} onCloseDuplicates={handleCloseDuplicates} onCloseTab={handleCloseTab} />
            </div>
          )}
        </ScrollArea>

        <StatsBar windows={tabs.windows} allTabs={tabs.allTabs} suspendedCount={tabs.suspendedTabs.size} />
      </div>
    </TooltipProvider>
  );
}
