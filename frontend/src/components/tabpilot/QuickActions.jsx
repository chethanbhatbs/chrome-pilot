import {
  Plus, Monitor, ClipboardCheck, VolumeX, Save, LayoutGrid
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';

const actions = [
  { id: 'new-tab', icon: Plus, label: 'New Tab', key: 'onNewTab' },
  { id: 'new-window', icon: Monitor, label: 'New Window', key: 'onNewWindow' },
  { id: 'close-dupes', icon: ClipboardCheck, label: 'Close Duplicates', key: 'onCloseDuplicates' },
  { id: 'mute-all', icon: VolumeX, label: 'Mute All', key: 'onMuteAll' },
  { id: 'save-session', icon: Save, label: 'Save Session', key: 'onSaveSession' },
  { id: 'group-domain', icon: LayoutGrid, label: 'Group by Domain', key: 'onToggleGrouping' },
];

export function QuickActions({ handlers, viewMode }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50" data-testid="quick-actions">
      {actions.map(({ id, icon: Icon, label, key }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <button
              data-testid={`action-${id}`}
              onClick={handlers[key]}
              className={`p-1.5 rounded-md transition-all duration-150 text-muted-foreground
                hover:text-foreground hover:bg-white/10 active:scale-95
                ${id === 'group-domain' && viewMode === 'domain' ? 'text-primary bg-primary/10' : ''}
              `}
            >
              <Icon size={14} strokeWidth={1.5} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] font-body">
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
