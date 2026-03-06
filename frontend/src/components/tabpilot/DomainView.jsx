import { getDomain, getFaviconUrl, groupByDomain } from '@/utils/grouping';
import { Globe, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function DomainView({
  allTabs, windows, showFavicons, showUrls, compact,
  highlightText, matchingTabIds,
  onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToWindow, onMoveToNewWindow, onCloseOthers, onCloseToRight,
  onReorderTab, onMoveTab, suspendedTabs, onSuspend, onUnsuspend, tabNotes, onAddNote,
  onHoverEnter, onHoverLeave, duplicateTabIds
}) {
  const filteredTabs = matchingTabIds
    ? allTabs.filter(t => matchingTabIds.has(t.id))
    : allTabs;

  const domains = groupByDomain(filteredTabs);
  const focusedWindowId = windows?.find(w => w.focused)?.id;

  return (
    <div className="py-0.5" data-testid="domain-view">
      {domains.map(({ domain, tabs }) => (
        <DomainGroup
          key={domain}
          domain={domain}
          tabs={tabs}
          showFavicons={showFavicons}
          compact={compact}
          highlightText={highlightText}
          onSwitch={onSwitch}
          onClose={onClose}
          suspendedTabs={suspendedTabs}
          tabNotes={tabNotes}
          onHoverEnter={onHoverEnter}
          onHoverLeave={onHoverLeave}
          focusedWindowId={focusedWindowId}
        />
      ))}
    </div>
  );
}

function DomainGroup({
  domain, tabs, showFavicons, compact,
  highlightText, onSwitch, onClose,
  suspendedTabs, tabNotes,
  onHoverEnter, onHoverLeave, focusedWindowId
}) {
  const [isOpen, setIsOpen] = useState(true);
  const faviconUrl = getFaviconUrl(tabs[0]?.url);
  const activeTabs = tabs.filter(t => t.active).length;
  // Short domain for display
  const shortDomain = domain.replace(/^www\./, '');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div data-testid={`domain-group-${domain}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer
            hover:bg-white/[0.03] transition-colors"
          >
            <ChevronRight
              size={11}
              className={`text-muted-foreground/40 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
              strokeWidth={2}
            />
            {showFavicons && faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded-[3px] shrink-0" onError={e => e.target.style.display = 'none'} />
            ) : (
              <Globe size={12} className="text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
            )}
            <span className="text-[11px] font-heading font-semibold truncate flex-1 min-w-0">{shortDomain}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeTabs > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              <span className="text-[9px] text-muted-foreground/40 font-mono">{tabs.length}</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-5 pb-0.5">
            {tabs.map(tab => (
              <DomainTabItem
                key={tab.id}
                tab={tab}
                compact={compact}
                highlightText={highlightText}
                onSwitch={onSwitch}
                onClose={onClose}
                suspended={suspendedTabs?.has(tab.id)}
                tabNote={tabNotes?.[tab.id]}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
                focusedWindowId={focusedWindowId}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function DomainTabItem({ tab, compact, highlightText, onSwitch, onClose, suspended, tabNote, onHoverEnter, onHoverLeave, focusedWindowId }) {
  const { X, Pin, StickyNote, Volume2, Pause } = require('lucide-react');

  return (
    <div
      data-testid={`domain-tab-${tab.id}`}
      onClick={() => {
        if (suspended) return;
        onSwitch(tab.id);
      }}
      onMouseEnter={(e) => onHoverEnter?.(tab, e)}
      onMouseLeave={() => onHoverLeave?.()}
      className={`group flex items-center gap-1.5 cursor-pointer transition-all duration-100 relative
        ${compact ? 'px-2 py-[3px]' : 'px-2 py-[5px]'}
        ${(tab.active && tab.windowId === focusedWindowId)
          ? 'bg-primary/[0.08] text-foreground'
          : 'hover:bg-white/[0.04] text-foreground/75'
        }
        ${suspended ? 'opacity-35' : ''}
      `}
    >
      {(tab.active && tab.windowId === focusedWindowId) && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-r-full bg-primary" />
      )}
      <span className={`font-body leading-tight truncate flex-1 min-w-0 ${compact ? 'text-[11px]' : 'text-[11.5px]'}`}>
        {highlightText ? highlightText(tab.title) : tab.title}
      </span>
      <div className="flex items-center gap-0 shrink-0">
        {tab.pinned && <Pin size={9} className="text-tp-pinned" strokeWidth={2} />}
        {tab.audible && !tab.mutedInfo?.muted && <Volume2 size={9} className="text-tp-audible" strokeWidth={2} />}
        {suspended && <Pause size={9} className="text-muted-foreground/40" strokeWidth={2} />}
        {tabNote && <StickyNote size={9} className="text-primary/60" strokeWidth={1.5} />}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
        className="cursor-pointer p-0.5 rounded-[3px] text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10
          opacity-0 group-hover:opacity-100 transition-all duration-100 shrink-0"
      >
        <X size={10} strokeWidth={1.5} />
      </button>
    </div>
  );
}
