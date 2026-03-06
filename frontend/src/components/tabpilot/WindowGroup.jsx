import { useState, useCallback } from 'react';
import { ChevronRight, Minus, X, Monitor } from 'lucide-react';
import { TabItem } from './TabItem';
import { TabGroupHeader } from './TabGroupHeader';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

export function WindowGroup({
  window: win, tabGroups, showFavicons, showUrls, compact,
  highlightText, matchingTabIds, windows,
  onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToWindow, onMoveToNewWindow, onCloseOthers, onCloseToRight,
  onCloseWindow, onMinimizeWindow, onReorderTab, onMoveTab,
  suspendedTabs, onSuspend, onUnsuspend
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const isFocused = win.focused;
  const tabCount = win.tabs.length;

  const windowTabGroups = tabGroups.filter(g => g.windowId === win.id);

  const filteredTabs = matchingTabIds
    ? win.tabs.filter(t => matchingTabIds.has(t.id))
    : win.tabs;

  const handleDragStart = useCallback((e, tab) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ tabId: tab.id, windowId: win.id }));
    e.dataTransfer.effectAllowed = 'move';
  }, [win.id]);

  const handleDragOver = useCallback((e, tab) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const idx = win.tabs.findIndex(t => t.id === tab.id);
    setDragOverIdx(idx);
  }, [win.tabs]);

  const handleDrop = useCallback((e, targetTab) => {
    e.preventDefault();
    setDragOverIdx(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const targetIdx = win.tabs.findIndex(t => t.id === targetTab.id);
      if (data.windowId === win.id) {
        onReorderTab(data.tabId, win.id, targetIdx);
      } else {
        onMoveTab(data.tabId, win.id, targetIdx);
      }
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
    onSwitch, onClose, onPin, onMute, onDuplicate,
    onMoveToNewWindow, onMoveToWindow: (tabId, winId) => onMoveTab(tabId, winId),
    onCloseOthers, onCloseToRight, windows, currentWindowId: win.id,
    onDragStart: handleDragStart, onDragOver: handleDragOver,
    onDrop: handleDrop, onDragEnd: handleDragEnd,
    onSuspend, onUnsuspend,
  };

  if (filteredTabs.length === 0) return null;

  // Build a rendering plan: group consecutive grouped tabs under their header
  const renderElements = () => {
    const elements = [];
    const renderedGroupHeaders = new Set();

    for (const tab of filteredTabs) {
      const group = windowTabGroups.find(g => g.id === tab.groupId);

      if (group) {
        if (!renderedGroupHeaders.has(group.id)) {
          renderedGroupHeaders.add(group.id);
          elements.push(
            <div key={`gh-${group.id}`} className="ml-3 mt-1.5">
              <TabGroupHeader
                group={group}
                collapsed={collapsedGroups[group.id]}
                onToggle={() => setCollapsedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
              />
            </div>
          );
        }
        if (!collapsedGroups[group.id]) {
          elements.push(
            <div
              key={tab.id}
              className={`ml-5 animate-slide-in ${dragOverIdx === win.tabs.indexOf(tab) ? 'border-t border-primary' : ''}`}
            >
              <TabItem tab={tab} isActive={tab.active} suspended={suspendedTabs?.has(tab.id)} {...tabItemProps} />
            </div>
          );
        }
      } else {
        elements.push(
          <div
            key={tab.id}
            className={`ml-3 animate-slide-in ${dragOverIdx === win.tabs.indexOf(tab) ? 'border-t border-primary' : ''}`}
          >
            <TabItem tab={tab} isActive={tab.active} suspended={suspendedTabs?.has(tab.id)} {...tabItemProps} />
          </div>
        );
      }
    }
    return elements;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="mb-0.5"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={handleWindowDrop}
        data-testid={`window-group-${win.id}`}
      >
        <CollapsibleTrigger asChild>
          <div className={`flex items-center justify-between px-3 py-2 cursor-pointer
            hover:bg-white/[0.03] transition-colors
            ${isFocused ? 'bg-primary/[0.04]' : ''}`}
          >
            <div className="flex items-center gap-2">
              <ChevronRight
                size={11}
                className={`text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                strokeWidth={2.5}
              />
              <Monitor size={12} className={isFocused ? 'text-primary' : 'text-muted-foreground/50'} strokeWidth={1.5} />
              <span className="text-[11px] font-heading font-semibold tracking-tight">
                Window {win.id}
              </span>
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {tabCount}
              </span>
              {isFocused && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ opacity: undefined }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
              <button
                data-testid={`window-minimize-${win.id}`}
                onClick={(e) => { e.stopPropagation(); onMinimizeWindow(win.id); }}
                className="p-1 rounded-[3px] text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <Minus size={10} strokeWidth={1.5} />
              </button>
              <button
                data-testid={`window-close-${win.id}`}
                onClick={(e) => { e.stopPropagation(); onCloseWindow(win.id); }}
                className="p-1 rounded-[3px] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X size={10} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pb-1">
            {renderElements()}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
