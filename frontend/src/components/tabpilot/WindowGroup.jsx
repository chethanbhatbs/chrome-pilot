import { useState, useCallback, useMemo, useRef } from 'react';
import { ChevronRight, Minus, X, Monitor, Plus } from 'lucide-react';
import { TabItem } from './TabItem';
import { TabGroupHeader } from './TabGroupHeader';
import { TAB_GROUP_COLORS } from '@/utils/mockData';
import { getDomain } from '@/utils/grouping';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

export function WindowGroup({
  window: win, tabGroups, showFavicons, showUrls, compact,
  highlightText, matchingTabIds, windows, duplicateTabIds,
  onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToWindow, onMoveToNewWindow, onCloseOthers, onCloseToRight,
  onCloseWindow, onMinimizeWindow, onReorderTab, onMoveTab,
  onCreateTabInWindow, onRenameWindow,
  suspendedTabs, onSuspend, onUnsuspend, tabNotes, onAddNote,
  onHoverEnter, onHoverLeave
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
    e.dataTransfer.setData('application/json', JSON.stringify({ tabId: tab.id, windowId: win.id }));
    e.dataTransfer.effectAllowed = 'move';
  }, [win.id]);

  const handleDragOver = useCallback((e, tab) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(win.tabs.findIndex(t => t.id === tab.id));
  }, [win.tabs]);

  const handleDrop = useCallback((e, targetTab) => {
    e.preventDefault();
    setDragOverIdx(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const targetIdx = win.tabs.findIndex(t => t.id === targetTab.id);
      if (data.windowId === win.id) onReorderTab(data.tabId, win.id, targetIdx);
      else onMoveTab(data.tabId, win.id, targetIdx);
      toast.success('Tab moved');
    } catch { /* ignore */ }
  }, [win.id, win.tabs, onReorderTab, onMoveTab]);

  const handleDragEnd = useCallback(() => setDragOverIdx(null), []);

  const handleWindowDrop = useCallback((e) => {
    e.preventDefault();
    setDragOverIdx(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.windowId !== win.id) {
        onMoveTab(data.tabId, win.id, -1);
        toast.success('Tab moved');
      }
    } catch { /* ignore */ }
  }, [win.id, onMoveTab]);

  const tabItemProps = {
    showFavicons, showUrls, compact, highlightText,
    onSwitch, onClose, onPin, onMute,
    onDuplicate: (tabId) => { setShowAllTabs(true); onDuplicate(tabId); toast.success('Tab duplicated', { duration: 1500 }); },
    onMoveToNewWindow, onMoveToWindow: (tabId, winId) => onMoveTab(tabId, winId),
    onCloseOthers, onCloseToRight, windows, currentWindowId: win.id,
    onDragStart: handleDragStart, onDragOver: handleDragOver,
    onDrop: handleDrop, onDragEnd: handleDragEnd,
    onSuspend, onUnsuspend, onAddNote,
    onHoverEnter, onHoverLeave,
  };

  const handleStartRename = () => {
    setRenameValue(win.name || `Window ${win.id}`);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 50);
  };

  const handleSaveRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && onRenameWindow) onRenameWindow(win.id, trimmed || `Window ${win.id}`);
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
          // Grouped tab: colored left border gutter at the edge, NO extra indent
          elements.push(
            <div
              key={tab.id}
              className={`animate-slide-in border-l-[3px] ${dragOverIdx === win.tabs.indexOf(tab) ? 'border-t border-t-primary' : ''}`}
              style={{ borderLeftColor: color.bg + '50' }}
            >
              <TabItem tab={tab} isActive={tab.active && isFocused} suspended={suspendedTabs?.has(tab.id)}
                tabNote={tabNotes?.[tab.id]} isDuplicate={duplicateTabIds?.has(tab.id)}
                {...tabItemProps} />
            </div>
          );
        }
      } else {
        // Ungrouped tab: transparent left border to maintain the same layout as grouped tabs
        elements.push(
          <div
            key={tab.id}
            className={`animate-slide-in border-l-[3px] border-l-transparent ${dragOverIdx === win.tabs.indexOf(tab) ? 'border-t border-primary' : ''}`}
          >
            <TabItem tab={tab} isActive={tab.active && isFocused} suspended={suspendedTabs?.has(tab.id)}
              tabNote={tabNotes?.[tab.id]} isDuplicate={duplicateTabIds?.has(tab.id)}
              {...tabItemProps} />
          </div>
        );
      }
    }
    return elements;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={handleWindowDrop}
        data-testid={`window-group-${win.id}`}
      >
        <CollapsibleTrigger asChild>
          <div className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer
            hover:bg-white/[0.03] transition-colors
            ${isFocused ? 'bg-primary/[0.04]' : ''}`}
          >
            <div className="flex items-center gap-2">
              <ChevronRight
                size={13}
                className={`text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                strokeWidth={2}
              />
              <Monitor size={12} className={isFocused ? 'text-primary' : 'text-muted-foreground/40'} strokeWidth={1.5} />
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
                      {win.name || `Window ${win.id}`}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground/40 font-mono">{tabCount}</span>
                  {isFocused && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground/40 font-body italic truncate max-w-[180px]">
                  {windowSummary}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5"
              style={{ opacity: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
              {/* Add tab to this window */}
              <button
                data-testid={`window-add-tab-${win.id}`}
                onClick={(e) => { e.stopPropagation(); onCreateTabInWindow && onCreateTabInWindow(win.id); }}
                className="cursor-pointer p-0.5 rounded-[3px] text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                title="New tab in this window"
              >
                <Plus size={10} strokeWidth={1.5} />
              </button>
              <button
                data-testid={`window-minimize-${win.id}`}
                onClick={(e) => { e.stopPropagation(); onMinimizeWindow(win.id); }}
                className="cursor-pointer p-0.5 rounded-[3px] text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <Minus size={10} strokeWidth={1.5} />
              </button>
              <button
                data-testid={`window-close-${win.id}`}
                onClick={(e) => { e.stopPropagation(); onCloseWindow(win.id); }}
                className="cursor-pointer p-0.5 rounded-[3px] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X size={10} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pb-0.5 pl-5">
            {(() => {
              const allElements = renderElements();
              const TAB_LIMIT = 5;
              if (allElements.length <= TAB_LIMIT || showAllTabs) {
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
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
