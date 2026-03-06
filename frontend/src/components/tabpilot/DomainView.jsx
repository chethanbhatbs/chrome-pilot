import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { groupByDomain } from '@/utils/grouping';
import { Globe, ChevronRight } from 'lucide-react';
import { TabItem } from './TabItem';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function DomainView({
  allTabs, windows, showFavicons, showUrls, compact,
  highlightText, matchingTabIds,
  onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToWindow, onMoveToNewWindow, onCloseOthers, onCloseToRight,
  onReorderTab, onMoveTab
}) {
  const filteredTabs = matchingTabIds
    ? allTabs.filter(t => matchingTabIds.has(t.id))
    : allTabs;

  const domains = groupByDomain(filteredTabs);

  return (
    <div className="py-0.5">
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
        />
      ))}
    </div>
  );
}

function DomainGroup({
  domain, tabs, windows, showFavicons, showUrls, compact,
  highlightText, onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToNewWindow, onMoveToWindow, onCloseOthers, onCloseToRight,
  onReorderTab, onMoveTab
}) {
  const [isOpen, setIsOpen] = useState(true);
  const faviconUrl = getFaviconUrl(tabs[0]?.url);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-b border-border/50" data-testid={`domain-group-${domain}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors">
            <ChevronRight
              size={12}
              className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              strokeWidth={2}
            />
            {showFavicons && faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-3.5 h-3.5 rounded-sm" />
            ) : (
              <Globe size={13} className="text-muted-foreground" strokeWidth={1.5} />
            )}
            <span className="text-xs font-heading font-semibold truncate">{domain}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ({tabs.length})
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="py-0.5">
            {tabs.map(tab => (
              <div key={tab.id} className="animate-slide-in">
                <TabItem
                  tab={tab}
                  isActive={tab.active}
                  showFavicons={showFavicons}
                  showUrls={false}
                  compact={compact}
                  highlightText={highlightText}
                  onSwitch={onSwitch}
                  onClose={onClose}
                  onPin={onPin}
                  onMute={onMute}
                  onDuplicate={onDuplicate}
                  onMoveToNewWindow={onMoveToNewWindow}
                  onMoveToWindow={(tabId, winId) => onMoveTab(tabId, winId)}
                  onCloseOthers={onCloseOthers}
                  onCloseToRight={onCloseToRight}
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
