import {
  Plus, Monitor, ClipboardCheck, VolumeX, Save, LayoutGrid, Flame
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';

const leftActions = [
  { id: 'new-tab', icon: Plus, label: 'New Tab', key: 'onNewTab' },
  { id: 'new-window', icon: Monitor, label: 'New Window', key: 'onNewWindow' },
];

const rightActions = [
  { id: 'close-dupes', icon: ClipboardCheck, label: 'Close Duplicates', key: 'onCloseDuplicates' },
  { id: 'mute-all', icon: VolumeX, label: 'Mute All', key: 'onMuteAll' },
  { id: 'save-session', icon: Save, label: 'Save Session', key: 'onSaveSession' },
  { id: 'group-domain', icon: LayoutGrid, label: 'Group by Domain', key: 'onToggleGrouping', toggle: 'domain' },
  { id: 'heatmap', icon: Flame, label: 'Activity Heatmap', key: 'onToggleHeatmap', toggle: 'heatmap' },
];

export function QuickActions({ handlers, viewMode, activePanel }) {
  return (
    <div className="flex items-center justify-between px-1" data-testid="quick-actions">
      <div className="flex items-center gap-0.5">
        {leftActions.map(({ id, icon: Icon, label, key }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                data-testid={`action-${id}`}
                onClick={handlers[key]}
                className="p-1.5 rounded-md transition-all duration-150 text-muted-foreground/60
                  hover:text-foreground hover:bg-white/[0.06] active:scale-95"
              >
                <Icon size={13} strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-body">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex items-center gap-0.5">
        {rightActions.map(({ id, icon: Icon, label, key, toggle }) => {
          const isToggled = (toggle === 'domain' && viewMode === 'domain') ||
                            (toggle === 'heatmap' && activePanel === 'heatmap');
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  data-testid={`action-${id}`}
                  onClick={handlers[key]}
                  className={`p-1.5 rounded-md transition-all duration-150 active:scale-95
                    ${isToggled
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.06]'
                    }
                  `}
                >
                  <Icon size={13} strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-body">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
