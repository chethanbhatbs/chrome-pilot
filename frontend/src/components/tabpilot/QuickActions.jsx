import {
  Plus, Monitor, LayoutGrid, List, Focus, CheckSquare, FileText
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
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
                <span className="text-[11px] leading-tight mt-0.5 font-body tracking-wide">New</span>
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
      <ActionBtn id="focus-mode" icon={Focus} label="Focus" handler={handlers.onToggleFocus}
        active={activePanel === 'focus'} />

      <div className="flex-1" />

      {/* Select mode toggle — only visible on tabs/sites view */}
      {!activePanel && (
        <ActionBtn
          id="select-toggle"
          icon={CheckSquare}
          label="Select"
          handler={onToggleSelectMode}
          active={selectMode}
        />
      )}
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
      <span className="text-[11px] leading-tight mt-0.5 font-body tracking-wide">{label}</span>
    </button>
  );
}
