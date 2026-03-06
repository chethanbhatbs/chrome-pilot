import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { groupByDomain } from '@/utils/grouping';
import { Globe, ChevronRight, ExternalLink } from 'lucide-react';
import { TabItem } from './TabItem';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function DomainView({
  allTabs, windows, showFavicons, showUrls, compact,
  highlightText, matchingTabIds,
  onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToWindow, onMoveToNewWindow, onCloseOthers, onCloseToRight,
  onReorderTab, onMoveTab, suspendedTabs, onSuspend, onUnsuspend, tabNotes, onAddNote
}) {
  const filteredTabs = matchingTabIds
    ? allTabs.filter(t => matchingTabIds.has(t.id))
    : allTabs;

  const domains = groupByDomain(filteredTabs);

  return (
    <div className="px-2 py-1 space-y-1" data-testid="domain-view">
      {domains.map(({ domain, tabs }) => (
        <DomainGroup
          key={domain}
          domain={domain}
          tabs={tabs}
          windows={windows}
          showFavicons={showFavicons}
          showUrls={showUrls}
          compact={compact}
          highlightText={highlightText}
          onSwitch={onSwitch}
          onClose={onClose}
          onPin={onPin}
          onMute={onMute}
          onDuplicate={onDuplicate}
          onMoveToNewWindow={onMoveToNewWindow}
          onMoveToWindow={onMoveToWindow}
          onCloseOthers={onCloseOthers}
          onCloseToRight={onCloseToRight}
          onReorderTab={onReorderTab}
          onMoveTab={onMoveTab}
          suspendedTabs={suspendedTabs}
          onSuspend={onSuspend}
          onUnsuspend={onUnsuspend}
          tabNotes={tabNotes}
          onAddNote={onAddNote}
        />
      ))}
    </div>
  );
}

function DomainGroup({
  domain, tabs, windows, showFavicons, showUrls, compact,
  highlightText, onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToNewWindow, onMoveToWindow, onCloseOthers, onCloseToRight,
  onReorderTab, onMoveTab, suspendedTabs, onSuspend, onUnsuspend, tabNotes, onAddNote
}) {
  const [isOpen, setIsOpen] = useState(true);
  const faviconUrl = getFaviconUrl(tabs[0]?.url);
  const activeTabs = tabs.filter(t => t.active).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="rounded-lg bg-card/50 border border-border/30 overflow-hidden"
        data-testid={`domain-group-${domain}`}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer
            hover:bg-white/[0.03] transition-colors"
          >
            <ChevronRight
              size={10}
              className={`text-muted-foreground/40 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              strokeWidth={2.5}
            />
            {showFavicons && faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded-[3px] shrink-0" onError={e => e.target.style.display = 'none'} />
            ) : (
              <Globe size={13} className="text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
            )}
            <span className="text-[11px] font-heading font-semibold truncate flex-1">{domain}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeTabs > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              <span className="text-[9px] text-muted-foreground/50 font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
                {tabs.length}
              </span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pb-0.5">
            {tabs.map(tab => (
              <div key={tab.id} className="animate-slide-in">
                <TabItem
                  tab={tab}
                  isActive={tab.active}
                  showFavicons={false}
                  showUrls={false}
                  compact={compact}
                  highlightText={highlightText}
                  suspended={suspendedTabs?.has(tab.id)}
                  tabNote={tabNotes?.[tab.id]}
                  onSwitch={onSwitch}
                  onClose={onClose}
                  onPin={onPin}
                  onMute={onMute}
                  onDuplicate={onDuplicate}
                  onMoveToNewWindow={onMoveToNewWindow}
                  onMoveToWindow={(tabId, winId) => onMoveTab(tabId, winId)}
                  onCloseOthers={onCloseOthers}
                  onCloseToRight={onCloseToRight}
                  onSuspend={onSuspend}
                  onUnsuspend={onUnsuspend}
                  onAddNote={onAddNote}
                  windows={windows}
                  currentWindowId={tab.windowId}
                />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
