import { useState, useRef, useCallback, useEffect } from 'react';
import { Settings, ArrowLeft, HelpCircle } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchBar } from './SearchBar';
import { QuickActions } from './QuickActions';
import { WindowGroup } from './WindowGroup';
import { DomainView } from './DomainView';
import { DuplicatePanel } from './DuplicatePanel';
import { SessionManager } from './SessionManager';
import { SettingsPanel } from './SettingsPanel';
import { HeatmapPanel } from './HeatmapPanel';
import { FocusMode } from './FocusMode';
import { HelpPanel } from './HelpPanel';
import { StatsBar } from './StatsBar';
import { useMockTabs } from '@/hooks/useMockTabs';
import { useSearch } from '@/hooks/useSearch';
import { useSessions } from '@/hooks/useSessions';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

export function Sidebar() {
  const tabs = useMockTabs();
  const search = useSearch(tabs.allTabs);
  const { sessions, saveSession, deleteSession } = useSessions();
  const { settings, updateSetting } = useSettings();
  const searchInputRef = useRef(null);

  const [activePanel, setActivePanel] = useState(null);
  const [viewMode, setViewMode] = useState('window');
  const [selectedTabIdx, setSelectedTabIdx] = useState(-1);
  const [visitCounts, setVisitCounts] = useState({});

  const handleSwitchTab = useCallback((tabId) => {
    tabs.switchToTab(tabId);
    setVisitCounts(prev => ({ ...prev, [tabId]: (prev[tabId] || 0) + 1 }));
    const tab = tabs.allTabs.find(t => t.id === tabId);
    if (tab) toast.info(`Switched to: ${tab.title}`, { duration: 1500 });
  }, [tabs]);

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
  }, []);

  const handleToggleHeatmap = useCallback(() => {
    setActivePanel(prev => prev === 'heatmap' ? null : 'heatmap');
  }, []);

  const handleToggleFocus = useCallback(() => {
    setActivePanel(prev => prev === 'focus' ? null : 'focus');
  }, []);

  const handleSuspendInactive = useCallback(() => {
    const count = tabs.suspendInactive();
    if (count > 0) toast.success(`Suspended ${count} inactive tab${count > 1 ? 's' : ''}`);
    else toast.info('No inactive tabs to suspend');
  }, [tabs]);

  const handleRestoreSession = useCallback((session) => {
    toast.info(`Session "${session.name}" restored (${session.tabCount} tabs)`);
  }, []);

  const quickActionHandlers = {
    onNewTab: tabs.createNewTab,
    onNewWindow: tabs.createNewWindow,
    onCloseDuplicates: handleCloseDuplicates,
    onMuteAll: () => { tabs.muteAll(); toast.success('All tabs muted'); },
    onSaveSession: handleSaveSession,
    onToggleGrouping: handleToggleGrouping,
    onToggleHeatmap: handleToggleHeatmap,
    onToggleFocus: handleToggleFocus,
    onSuspendInactive: handleSuspendInactive,
  };

  useEffect(() => {
    const handler = (e) => {
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
  }, [selectedTabIdx, tabs.allTabs, handleSwitchTab, handleCloseTab]);

  const sharedTabProps = {
    showFavicons: settings.showFavicons,
    showUrls: settings.showUrls,
    compact: settings.compactMode,
    highlightText: search.query ? search.highlightText : null,
    matchingTabIds: search.matchingTabIds,
    windows: tabs.windows,
    suspendedTabs: tabs.suspendedTabs,
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
  };

  const showBackButton = ['settings', 'sessions', 'heatmap', 'help'].includes(activePanel);

  // Focus mode renders a completely different layout
  if (activePanel === 'focus') {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col h-full bg-background font-body" data-testid="sidebar">
          <FocusMode
            allTabs={tabs.allTabs}
            visitCounts={visitCounts}
            onSwitch={handleSwitchTab}
            onExit={() => setActivePanel(null)}
          />
          <StatsBar windows={tabs.windows} allTabs={tabs.allTabs} suspendedCount={tabs.suspendedTabs.size} />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-background font-body" data-testid="sidebar">
        {/* Header */}
        <div className="px-2 pt-2 pb-1.5 space-y-1.5 bg-background/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-1">
            <div className="flex-1">
              <SearchBar
                query={search.query}
                setQuery={search.setQuery}
                resultCount={search.resultCount}
                clearSearch={search.clearSearch}
                inputRef={searchInputRef}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  data-testid="help-toggle-btn"
                  onClick={() => setActivePanel(activePanel === 'help' ? null : 'help')}
                  className={`p-1.5 rounded-md transition-all duration-150
                    ${activePanel === 'help'
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.06]'
                    } active:scale-95`}
                >
                  <HelpCircle size={13} strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-body">Help & Feedback</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  data-testid="settings-toggle-btn"
                  onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
                  className={`p-1.5 rounded-md transition-all duration-150
                    ${activePanel === 'settings'
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.06]'
                    } active:scale-95`}
                >
                  <Settings size={13} strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-body">Settings</TooltipContent>
            </Tooltip>
          </div>
          <QuickActions handlers={quickActionHandlers} viewMode={viewMode} activePanel={activePanel} />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {showBackButton && (
            <button
              data-testid={`back-from-${activePanel}`}
              onClick={() => setActivePanel(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ArrowLeft size={11} strokeWidth={1.5} /> Back to tabs
            </button>
          )}

          {activePanel === 'settings' ? (
            <div className="animate-slide-in">
              <SettingsPanel settings={settings} onUpdate={updateSetting} />
            </div>
          ) : activePanel === 'sessions' ? (
            <div className="animate-slide-in">
              <SessionManager
                sessions={sessions}
                onSave={saveSession}
                onDelete={deleteSession}
                onRestore={handleRestoreSession}
                windows={tabs.windows}
              />
            </div>
          ) : activePanel === 'heatmap' ? (
            <div className="animate-slide-in">
              <HeatmapPanel
                allTabs={tabs.allTabs}
                visitCounts={visitCounts}
                onSwitch={handleSwitchTab}
              />
            </div>
          ) : activePanel === 'help' ? (
            <div className="animate-slide-in">
              <HelpPanel onBack={() => setActivePanel(null)} />
            </div>
          ) : (
            <div>
              {viewMode === 'window' ? (
                tabs.windows.map(win => (
                  <WindowGroup
                    key={win.id}
                    window={win}
                    tabGroups={tabs.tabGroups}
                    onCloseWindow={tabs.closeWindow}
                    onMinimizeWindow={tabs.minimizeWindow}
                    {...sharedTabProps}
                  />
                ))
              ) : (
                <DomainView allTabs={tabs.allTabs} {...sharedTabProps} />
              )}
              <DuplicatePanel
                allTabs={tabs.allTabs}
                onCloseDuplicates={handleCloseDuplicates}
                onCloseTab={handleCloseTab}
              />
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <StatsBar windows={tabs.windows} allTabs={tabs.allTabs} suspendedCount={tabs.suspendedTabs.size} />
      </div>
    </TooltipProvider>
  );
}
