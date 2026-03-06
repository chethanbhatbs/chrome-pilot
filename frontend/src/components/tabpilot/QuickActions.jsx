import {
  Plus, Monitor, Pause, Play, ClipboardCheck, VolumeX, Volume2, Save,
  LayoutGrid, Flame, Focus, MoreHorizontal
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export function QuickActions({ handlers, viewMode, activePanel }) {
  return (
    <div className="flex items-center gap-0.5 px-0.5" data-testid="quick-actions">
      {/* Primary — always visible */}
      <ActionBtn id="new-tab" icon={Plus} label="New Tab" handler={handlers.onNewTab} />
      <ActionBtn id="new-window" icon={Monitor} label="Window" handler={handlers.onNewWindow} />

      <Divider />

      {/* View toggles — always visible */}
      <ActionBtn id="group-domain" icon={LayoutGrid} label="Domain" handler={handlers.onToggleGrouping}
        active={viewMode === 'domain'} />
      <ActionBtn id="heatmap" icon={Flame} label="Heatmap" handler={handlers.onToggleHeatmap}
        active={activePanel === 'heatmap'} />
      <ActionBtn id="focus-mode" icon={Focus} label="Focus" handler={handlers.onToggleFocus}
        active={activePanel === 'focus'} />

      <div className="flex-1" />

      {/* Overflow menu — secondary actions */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="action-more-menu"
                className="flex flex-col items-center gap-0 px-1.5 py-1 rounded-md transition-all duration-150
                  text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] active:scale-95 min-w-[30px]"
              >
                <MoreHorizontal size={13} strokeWidth={1.5} />
                <span className="text-[7px] leading-tight mt-0.5 font-body">More</span>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] font-body">More actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-44 font-body" data-testid="quick-actions-overflow">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Tab Control</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlers.onSuspendInactive} className="text-xs gap-2" data-testid="action-suspend-inactive">
            <Pause size={13} strokeWidth={1.5} /> Suspend Inactive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onUnsuspendAll} className="text-xs gap-2" data-testid="action-unsuspend-all">
            <Play size={13} strokeWidth={1.5} /> Resume All
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Audio</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlers.onMuteAll} className="text-xs gap-2" data-testid="action-mute-all">
            <VolumeX size={13} strokeWidth={1.5} /> Mute All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onUnmuteAll} className="text-xs gap-2" data-testid="action-unmute-all">
            <Volume2 size={13} strokeWidth={1.5} /> Unmute All
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Organization</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlers.onCloseDuplicates} className="text-xs gap-2" data-testid="action-close-dupes">
            <ClipboardCheck size={13} strokeWidth={1.5} /> Close Duplicates
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onSaveSession} className="text-xs gap-2" data-testid="action-save-session">
            <Save size={13} strokeWidth={1.5} /> Save Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border/40 mx-0.5 shrink-0" />;
}

function ActionBtn({ id, icon: Icon, label, handler, active }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-testid={`action-${id}`}
          onClick={handler}
          className={`flex flex-col items-center gap-0 px-1.5 py-1 rounded-md transition-all duration-150 active:scale-95 min-w-[30px]
            ${active
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06]'
            }
          `}
        >
          <Icon size={12} strokeWidth={1.5} />
          <span className="text-[7px] leading-tight mt-0.5 font-body">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px] font-body">{label}</TooltipContent>
    </Tooltip>
  );
}
