import {
  Plus, Monitor, Pause, Play, ClipboardCheck, VolumeX, Volume2,
  LayoutGrid, List, Flame, Focus, MoreHorizontal, CheckSquare, FileText
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export function QuickActions({ handlers, viewMode, activePanel, selectMode, onToggleSelectMode }) {
  return (
    <div className="flex items-center gap-0.5 px-0.5" data-testid="quick-actions">
      {/* New — dropdown with Tab + Window */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="action-new"
                className="cursor-pointer flex flex-col items-center gap-0 px-1.5 py-1 rounded-md transition-all duration-150 active:scale-95 min-w-[30px]
                  text-foreground/60 hover:text-foreground hover:bg-[hsl(var(--hover-medium))]"
              >
                <Plus size={13} strokeWidth={1.5} />
                <span className="text-[8px] leading-tight mt-0.5 font-body tracking-wide">New</span>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] font-body">New tab or window</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-36 font-body">
          <DropdownMenuItem onClick={handlers.onNewTab} className="text-xs gap-2 cursor-pointer" data-testid="action-new-tab">
            <FileText size={13} strokeWidth={1.5} /> New Tab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onNewWindow} className="text-xs gap-2 cursor-pointer" data-testid="action-new-window">
            <Monitor size={13} strokeWidth={1.5} /> New Window
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Divider />

      {/* View toggles */}
      <ActionBtn
        id="group-domain"
        icon={viewMode === 'domain' ? List : LayoutGrid}
        label={viewMode === 'domain' ? 'Tabs' : 'Sites'}
        handler={handlers.onToggleGrouping}
        active={viewMode === 'domain'}
      />
      <ActionBtn id="heatmap" icon={Flame} label="Activity" handler={handlers.onToggleHeatmap}
        active={activePanel === 'heatmap'} />
      <ActionBtn id="focus-mode" icon={Focus} label="Focus" handler={handlers.onToggleFocus}
        active={activePanel === 'focus'} />

      <div className="flex-1" />

      {/* Select mode toggle — only visible on tabs/sites view */}
      {!activePanel && (
        <>
          <ActionBtn
            id="select-toggle"
            icon={CheckSquare}
            label="Select"
            handler={onToggleSelectMode}
            active={selectMode}
          />
          <Divider />
        </>
      )}

      {/* Overflow menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="action-more-menu"
                className="cursor-pointer flex items-center justify-center p-1.5 rounded-md transition-all duration-150
                  text-foreground/60 hover:text-foreground hover:bg-[hsl(var(--hover-medium))] active:scale-95"
              >
                <MoreHorizontal size={14} strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] font-body">More actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-44 font-body" data-testid="quick-actions-overflow">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Tab Control</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlers.onSuspendInactive} className="text-xs gap-2 cursor-pointer" data-testid="action-suspend-inactive">
            <Pause size={13} strokeWidth={1.5} /> Suspend Inactive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onUnsuspendAll} className="text-xs gap-2 cursor-pointer" data-testid="action-unsuspend-all">
            <Play size={13} strokeWidth={1.5} /> Resume All
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Audio</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlers.onMuteAll} className="text-xs gap-2 cursor-pointer" data-testid="action-mute-all">
            <VolumeX size={13} strokeWidth={1.5} /> Mute All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onUnmuteAll} className="text-xs gap-2 cursor-pointer" data-testid="action-unmute-all">
            <Volume2 size={13} strokeWidth={1.5} /> Unmute All
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">Organization</DropdownMenuLabel>
          <DropdownMenuItem onClick={onToggleSelectMode} className="text-xs gap-2 cursor-pointer" data-testid="action-select-mode">
            <CheckSquare size={13} strokeWidth={1.5} /> {selectMode ? 'Exit Select Mode' : 'Select Tabs'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.onCloseDuplicates} className="text-xs gap-2 cursor-pointer" data-testid="action-close-dupes">
            <ClipboardCheck size={13} strokeWidth={1.5} /> Close Duplicates
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
    <button
      data-testid={`action-${id}`}
      onClick={handler}
      className={`cursor-pointer flex flex-col items-center gap-0 px-1.5 py-1 rounded-md transition-all duration-150 active:scale-95 min-w-[30px]
        ${active
          ? 'text-primary bg-primary/10'
          : 'text-foreground/60 hover:text-foreground hover:bg-[hsl(var(--hover-medium))]'
        }
      `}
    >
      <Icon size={13} strokeWidth={1.5} />
      <span className="text-[8px] leading-tight mt-0.5 font-body tracking-wide">{label}</span>
    </button>
  );
}
