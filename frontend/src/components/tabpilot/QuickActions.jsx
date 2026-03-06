import {
  Plus, Monitor, Pause, Play, ClipboardCheck, VolumeX, Volume2, Save, LayoutGrid, Flame, Focus
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

export function QuickActions({ handlers, viewMode, activePanel }) {
  return (
    <div className="flex items-center gap-0 px-0.5" data-testid="quick-actions">
      {/* Create group */}
      <ActionGroup>
        <ActionBtn id="new-tab" icon={Plus} label="New Tab" handler={handlers.onNewTab} />
        <ActionBtn id="new-window" icon={Monitor} label="New Window" handler={handlers.onNewWindow} />
      </ActionGroup>

      <Divider />

      {/* Suspend group */}
      <ActionGroup>
        <ActionBtn id="suspend-inactive" icon={Pause} label="Suspend" handler={handlers.onSuspendInactive} />
        <ActionBtn id="unsuspend-all" icon={Play} label="Resume" handler={handlers.onUnsuspendAll} />
      </ActionGroup>

      <Divider />

      {/* Audio group */}
      <ActionGroup>
        <ActionBtn id="mute-all" icon={VolumeX} label="Mute" handler={handlers.onMuteAll} />
        <ActionBtn id="unmute-all" icon={Volume2} label="Unmute" handler={handlers.onUnmuteAll} />
      </ActionGroup>

      <div className="flex-1" />

      {/* Tools group */}
      <ActionGroup>
        <ActionBtn id="close-dupes" icon={ClipboardCheck} label="Dupes" handler={handlers.onCloseDuplicates} />
        <ActionBtn id="save-session" icon={Save} label="Save" handler={handlers.onSaveSession} />
      </ActionGroup>

      <Divider />

      {/* View toggles */}
      <ActionGroup>
        <ActionBtn id="group-domain" icon={LayoutGrid} label="Domain" handler={handlers.onToggleGrouping}
          active={viewMode === 'domain'} />
        <ActionBtn id="heatmap" icon={Flame} label="Heatmap" handler={handlers.onToggleHeatmap}
          active={activePanel === 'heatmap'} />
        <ActionBtn id="focus-mode" icon={Focus} label="Focus" handler={handlers.onToggleFocus}
          active={activePanel === 'focus'} />
      </ActionGroup>
    </div>
  );
}

function ActionGroup({ children }) {
  return <div className="flex items-center gap-0">{children}</div>;
}

function Divider() {
  return <div className="w-px h-4 bg-border/40 mx-1 shrink-0" />;
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
