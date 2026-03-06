import { findDuplicates } from '@/utils/grouping';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

export function DuplicatePanel({ allTabs, onCloseDuplicates, onCloseTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const duplicates = findDuplicates(allTabs);

  if (duplicates.length === 0) return null;

  const totalDupes = duplicates.reduce((sum, d) => sum + d.tabs.length - 1, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mx-2 my-1.5 rounded-md border border-tp-duplicate/30 bg-tp-duplicate/5" data-testid="duplicate-panel">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-tp-duplicate/10 transition-colors rounded-md">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-tp-duplicate" strokeWidth={2} />
              <span className="text-xs font-body text-tp-duplicate font-medium">
                {totalDupes} duplicate{totalDupes !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              data-testid="close-all-duplicates-btn"
              onClick={(e) => { e.stopPropagation(); onCloseDuplicates(); }}
              className="text-[10px] font-heading font-semibold text-tp-duplicate hover:text-foreground
                bg-tp-duplicate/20 hover:bg-tp-duplicate/30 px-2 py-0.5 rounded transition-colors"
            >
              Fix All
            </button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-2.5 pb-2 space-y-1.5">
            {duplicates.map(({ url, tabs }) => (
              <div key={url} className="rounded bg-background/50 p-1.5">
                <div className="text-[10px] text-muted-foreground truncate mb-1 font-mono">{url}</div>
                {tabs.map((tab, i) => (
                  <div key={tab.id} className="flex items-center justify-between py-0.5 pl-2">
                    <span className="text-[11px] text-foreground/70 truncate flex-1">
                      {i === 0 && <Badge variant="outline" className="text-[8px] mr-1 py-0 px-1 border-tp-audible/50 text-tp-audible">keep</Badge>}
                      Window {tab.windowId}
                    </span>
                    {i > 0 && (
                      <button
                        data-testid={`close-dupe-${tab.id}`}
                        onClick={() => onCloseTab(tab.id)}
                        className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={10} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
