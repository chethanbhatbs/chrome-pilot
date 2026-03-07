import { useState, useCallback, useMemo, useRef } from 'react';
import { ChevronRight, X, Monitor, Plus, Check, MoreHorizontal, Minimize2, FilePlus } from 'lucide-react';
import { TabItem } from './TabItem';
import { TabGroupHeader } from './TabGroupHeader';
import { TAB_GROUP_COLORS } from '@/utils/mockData';
import { getDomain } from '@/utils/grouping';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function WindowGroup({
  window: win, tabGroups, showFavicons, showUrls, compact,
  highlightText, matchingTabIds, windows, duplicateTabIds,
  onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToWindow, onMoveToNewWindow, onCloseOthers, onCloseToRight,
  onCloseWindow, onMinimizeWindow, onReorderTab, onMoveTab,
  onCreateTabInWindow, onRenameWindow,
  suspendedTabs, onSuspend, onUnsuspend, tabNotes, onAddNote,
  onHoverEnter, onHoverLeave,
  selectMode, selectedTabIds, onToggleSelect, onSelectAllInWindow
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showAllTabs, setShowAllTabs] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef(null);

  const isFocused = win.focused;
  const tabCount = win.tabs.length;
  const windowTabGroups = tabGroups.filter(g => g.windowId === win.id);

  const filteredTabs = matchingTabIds
    ? win.tabs.filter(t => matchingTabIds.has(t.id))
    : win.tabs;

  // Window summary: most common domains with "+X more"
  const windowSummary = useMemo(() => {
    const domains = {};
    win.tabs.forEach(t => {
      const d = getDomain(t.url);
      domains[d] = (domains[d] || 0) + 1;
    });
    const sorted = Object.entries(domains).sort((a, b) => b[1] - a[1]);
    // Show short domain names (strip www. and long subdomains)
    const shorten = (d) => {
      d = d.replace(/^www\./, '');
      const parts = d.split('.');
      // For long subdomains like mycompany.atlassian.net, show just atlassian.net
      if (parts.length > 2 && d.length > 20) return parts.slice(-2).join('.');
      return d;
    };
    const shown = sorted.slice(0, 2).map(([d]) => shorten(d));
    const remaining = sorted.length - shown.length;
    return remaining > 0
      ? `${shown.join(', ')} +${remaining} more`
      : shown.join(', ');
  }, [win.tabs]);

  const handleDragStart = useCallback((e, tab) => {
    if (tab.pinned) {
      e.preventDefault();
      toast.info('Pinned tabs cannot be moved. Unpin first.', { duration: 2000 });
      return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify({ tabId: tab.id, windowId: win.id }));
    e.dataTransfer.effectAllowed = 'move';
  }, [win.id]);

  // --- Container-level drag & drop (single handler, no per-element listeners) ---
  const tabListRef = useRef(null);
  const dragOverIdxRef = useRef(null);

  // Find the correct insertion index from mouse Y by checking each tab row's midpoint
  const getDropIndex = useCallback((clientY) => {
    if (!tabListRef.current) return win.tabs.length;
    const items = tabListRef.current.querySelectorAll('[data-drop-idx]');
    if (items.length === 0) return 0;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return parseInt(item.dataset.dropIdx, 10);
      }
    }
    return win.tabs.length; // below all tabs → append to end
  }, [win.tabs.length]);

  const handleContainerDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const idx = getDropIndex(e.clientY);
    if (idx !== dragOverIdxRef.current) {
      dragOverIdxRef.current = idx;
      setDragOverIdx(idx);
    }
  }, [getDropIndex]);

  const handleContainerDrop = useCallback((e) => {
    e.preventDefault();
    const dropIdx = dragOverIdxRef.current ?? win.tabs.length;
    setDragOverIdx(null);
    dragOverIdxRef.current = null;
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.windowId === win.id) {
        // Same window reorder: chrome.tabs.move removes the tab first then inserts,
        // so when moving DOWN (source < target), the target shifts up by 1.
        const sourceIdx = win.tabs.findIndex(t => t.id === data.tabId);
        const adjustedIdx = (sourceIdx !== -1 && sourceIdx < dropIdx) ? dropIdx - 1 : dropIdx;
        onReorderTab(data.tabId, win.id, adjustedIdx);
      } else {
        onMoveTab(data.tabId, win.id, dropIdx);
      }
    } catch { /* ignore */ }
  }, [win.id, win.tabs, onReorderTab, onMoveTab]);

  const handleContainerDragLeave = useCallback((e) => {
    // Only clear when actually leaving the container, not entering a child
    if (!tabListRef.current?.contains(e.relatedTarget)) {
      setDragOverIdx(null);
      dragOverIdxRef.current = null;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragOverIdx(null);
    dragOverIdxRef.current = null;
  }, []);

  const tabItemProps = {
    showFavicons, showUrls, compact, highlightText,
    onSwitch, onClose, onPin, onMute,
    onDuplicate: (tabId) => { setShowAllTabs(true); onDuplicate(tabId); },
    onMoveToNewWindow, onMoveToWindow: (tabId, winId) => onMoveTab(tabId, winId),
    onCloseOthers, onCloseToRight, windows, currentWindowId: win.id,
    onDragStart: handleDragStart, onDragEnd: handleDragEnd,
    onSuspend, onUnsuspend, onAddNote,
    onHoverEnter, onHoverLeave,
    selectMode, onToggleSelect,
  };

  const handleStartRename = () => {
    setRenameValue(win.name || 'Window');
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 50);
  };

  const handleSaveRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && onRenameWindow) {
      // Prevent duplicate window names
      const nameExists = windows?.some(w => w.id !== win.id && (w.name || 'Window').toLowerCase() === trimmed.toLowerCase());
      if (nameExists) {
        toast.info(`Window "${trimmed}" already exists`);
        setIsRenaming(false);
        return;
      }
      onRenameWindow(win.id, trimmed || 'Window');
    }
    setIsRenaming(false);
  };

  if (filteredTabs.length === 0) return null;

  const renderElements = () => {
    const elements = [];
    const renderedGroupHeaders = new Set();

    for (const tab of filteredTabs) {
      const group = windowTabGroups.find(g => g.id === tab.groupId);

      if (group) {
        const color = TAB_GROUP_COLORS[group.color] || TAB_GROUP_COLORS.grey;
        if (!renderedGroupHeaders.has(group.id)) {
          renderedGroupHeaders.add(group.id);
          elements.push(
            <div key={`gh-${group.id}`} className="mt-0.5">
              <TabGroupHeader
                group={group}
                collapsed={collapsedGroups[group.id]}
                onToggle={() => setCollapsedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
              />
            </div>
          );
        }
        if (!collapsedGroups[group.id]) {
          const tabIdx = win.tabs.findIndex(t => t.id === tab.id);
          elements.push(
            <div
              key={tab.id}
              data-drop-idx={tabIdx}
              className={`animate-slide-in border-l-[3px] ${dragOverIdx === tabIdx ? 'border-t-2 border-t-primary' : ''}`}
              style={{ borderLeftColor: color.bg + '50' }}
            >
              <TabItem tab={tab} isActive={tab.active && isFocused} suspended={suspendedTabs?.has(tab.id)}
                tabNote={tabNotes?.[tab.id]} isDuplicate={duplicateTabIds?.has(tab.id)}
                isSelected={selectedTabIds?.has(tab.id)}
                {...tabItemProps} />
            </div>
          );
        }
      } else {
        const tabIdx = win.tabs.findIndex(t => t.id === tab.id);
        elements.push(
          <div
            key={tab.id}
            data-drop-idx={tabIdx}
            className={`animate-slide-in border-l-[3px] border-l-transparent ${dragOverIdx === tabIdx ? 'border-t-2 border-t-primary' : ''}`}
          >
            <TabItem tab={tab} isActive={tab.active && isFocused} suspended={suspendedTabs?.has(tab.id)}
              tabNote={tabNotes?.[tab.id]} isDuplicate={duplicateTabIds?.has(tab.id)}
              isSelected={selectedTabIds?.has(tab.id)}
              {...tabItemProps} />
          </div>
        );
      }
    }
    return elements;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div data-testid={`window-group-${win.id}`}>
        <CollapsibleTrigger asChild>
          <div className={`group/window flex items-center justify-between px-2.5 py-1.5 cursor-pointer
            hover:bg-[hsl(var(--hover-subtle))] transition-colors duration-150
            ${isFocused ? 'bg-primary/[0.06]' : ''}`}
          >
            <div className="flex items-center gap-2">
              {selectMode ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectAllInWindow?.(win.id); }}
                  className="cursor-pointer shrink-0"
                  data-testid={`select-all-window-${win.id}`}
                >
                  {(() => {
                    const allSel = win.tabs.length > 0 && win.tabs.every(t => selectedTabIds?.has(t.id));
                    const someSel = win.tabs.some(t => selectedTabIds?.has(t.id));
                    return (
                      <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all duration-150
                        ${allSel ? 'bg-primary border-primary' : someSel ? 'bg-primary/30 border-primary/60' : 'border-muted-foreground/30'}`}>
                        {allSel && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
                        {someSel && !allSel && <div className="w-1.5 h-0.5 rounded-full bg-primary" />}
                      </div>
                    );
                  })()}
                </button>
              ) : (
                <ChevronRight
                  size={13}
                  className={`text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  strokeWidth={2}
                />
              )}
              <Monitor size={12} className={isFocused ? 'text-primary' : 'text-muted-foreground/60'} strokeWidth={1.5} />
              <div>
                <div className="flex items-center gap-1.5">
                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.stopPropagation(); handleSaveRename(); }
                        if (e.key === 'Escape') setIsRenaming(false);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-heading font-semibold bg-card/60 border border-primary/40 rounded px-1 w-[110px] outline-none text-foreground"
                      data-testid={`window-rename-input-${win.id}`}
                    />
                  ) : (
                    <span
                      className="text-[11px] font-heading font-semibold tracking-tight cursor-text"
                      onDoubleClick={(e) => { e.stopPropagation(); handleStartRename(); }}
                      title="Double-click to rename"
                      data-testid={`window-name-${win.id}`}
                    >
                      {win.name || 'Window'}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground/60 font-mono">{tabCount}</span>
                  {isFocused && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground/60 font-body italic truncate max-w-[180px]">
                  {windowSummary}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/window:opacity-100 transition-opacity duration-150">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid={`window-menu-${win.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer p-0.5 rounded-[3px] text-muted-foreground/50 hover:text-foreground hover:bg-[hsl(var(--hover-medium))] transition-colors"
                  >
                    <MoreHorizontal size={11} strokeWidth={1.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 font-body">
                  <DropdownMenuItem onClick={() => onCreateTabInWindow?.(win.id)} className="text-xs gap-2 cursor-pointer" data-testid={`window-add-tab-${win.id}`}>
                    <FilePlus size={12} strokeWidth={1.5} /> New Tab
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMinimizeWindow(win.id)} className="text-xs gap-2 cursor-pointer" data-testid={`window-minimize-${win.id}`}>
                    <Minimize2 size={12} strokeWidth={1.5} /> {win.state === 'minimized' ? 'Restore' : 'Minimize'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onCloseWindow(win.id)} className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive" data-testid={`window-close-${win.id}`}>
                    <X size={12} strokeWidth={1.5} /> Close Window
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div
            ref={tabListRef}
            className="pb-0.5 pl-5"
            onDragOver={handleContainerDragOver}
            onDrop={handleContainerDrop}
            onDragLeave={handleContainerDragLeave}
          >
            {(() => {
              const allElements = renderElements();
              const TAB_LIMIT = 10;
              // Auto-expand if active tab is beyond the limit
              const activeIdx = filteredTabs.findIndex(t => t.active);
              const needsAutoExpand = activeIdx >= TAB_LIMIT;
              if (allElements.length <= TAB_LIMIT || showAllTabs || needsAutoExpand) {
                return allElements;
              }
              const visible = allElements.slice(0, TAB_LIMIT);
              const remaining = allElements.length - TAB_LIMIT;
              return (
                <>
                  {visible}
                  <button
                    data-testid={`show-more-${win.id}`}
                    onClick={() => setShowAllTabs(true)}
                    className="flex items-center gap-1 w-full px-2 py-1 text-[10px] text-primary/70
                      hover:text-primary hover:bg-primary/[0.04] transition-colors font-body"
                  >
                    <ChevronRight size={10} strokeWidth={2} />
                    Show {remaining} more tab{remaining > 1 ? 's' : ''}
                  </button>
                </>
              );
            })()}
            {/* End-of-list drop indicator */}
            <div className={`h-1 transition-colors duration-150 ${dragOverIdx === win.tabs.length ? 'border-t-2 border-t-primary' : ''}`} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
