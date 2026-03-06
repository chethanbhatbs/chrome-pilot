import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { Pin, Volume2, VolumeX, X, Loader2, Copy, StickyNote, GripVertical, Pause } from 'lucide-react';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger,
  ContextMenuSubContent, ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function TabItem({
  tab, isActive, showFavicons, showUrls, compact, suspended, isDuplicate,
  highlightText, onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToNewWindow, onMoveToWindow, onCloseOthers, onCloseToRight,
  onSuspend, onUnsuspend, onAddNote,
  windows, currentWindowId, tabNote,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onHoverEnter, onHoverLeave
}) {
  const domain = getDomain(tab.url);
  const faviconUrl = showFavicons ? getFaviconUrl(tab.url) : null;
  const isLoading = tab.status === 'loading';
  const isPinned = tab.pinned;
  const isAudible = tab.audible && !tab.mutedInfo?.muted;
  const isMuted = tab.mutedInfo?.muted;
  const isSuspended = suspended;
  const hasNote = !!tabNote;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tab.url);
    toast.success('URL copied');
  };

  const otherWindows = windows?.filter(w => w.id !== currentWindowId) || [];

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          data-testid={`tab-item-${tab.id}`}
          draggable
          onDragStart={(e) => onDragStart?.(e, tab)}
          onDragOver={(e) => onDragOver?.(e, tab)}
          onDrop={(e) => onDrop?.(e, tab)}
          onDragEnd={onDragEnd}
          onMouseEnter={(e) => onHoverEnter?.(tab, e)}
          onMouseLeave={() => onHoverLeave?.()}
          onClick={() => {
            if (isSuspended) onUnsuspend?.(tab.id);
            onSwitch(tab.id);
          }}
          className={`group flex items-center gap-1.5 cursor-pointer transition-all duration-100 select-none relative
            ${compact ? 'px-2 py-[3px]' : 'px-2 py-[5px]'}
            ${isActive
              ? 'bg-primary/[0.08] text-foreground'
              : 'hover:bg-white/[0.04] text-foreground/75'
            }
            ${isSuspended ? 'opacity-35' : ''}
            ${isDuplicate ? 'ring-1 ring-inset ring-tp-duplicate/30' : ''}
          `}
        >
          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-r-full bg-primary" />
          )}

          {/* Drag handle — visible on hover */}
          <div className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0 cursor-grab active:cursor-grabbing"
            data-testid={`drag-handle-${tab.id}`}
          >
            <GripVertical size={10} strokeWidth={1.5} />
          </div>

          {/* Favicon + status indicators */}
          <div className="w-4 h-4 shrink-0 flex items-center justify-center relative">
            {isLoading ? (
              <Loader2 size={12} className="animate-spin text-primary" strokeWidth={1.5} />
            ) : isSuspended ? (
              <Pause size={12} className="text-muted-foreground/40" strokeWidth={1.5} />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded-[3px]" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-3.5 h-3.5 rounded-[3px] bg-muted-foreground/20" />
            )}
          </div>

          {/* Title + URL */}
          <div className="flex-1 min-w-0">
            <div className={`font-body leading-tight truncate ${compact ? 'text-[11px]' : 'text-[11.5px]'}`}>
              {highlightText ? highlightText(tab.title) : tab.title}
            </div>
            {showUrls && !compact && (
              <div className="text-[10px] text-muted-foreground/40 truncate leading-tight mt-0.5">
                {highlightText ? highlightText(domain) : domain}
              </div>
            )}
          </div>

          {/* Status badges — always visible when applicable */}
          <div className="flex items-center gap-0 shrink-0">
            {isPinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-0.5" data-testid={`pin-badge-${tab.id}`}>
                    <Pin size={9} className="text-tp-pinned" strokeWidth={2} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">Pinned tab</TooltipContent>
              </Tooltip>
            )}
            {isDuplicate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-0.5" data-testid={`dupe-badge-${tab.id}`}>
                    <Copy size={9} className="text-tp-duplicate" strokeWidth={2} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">Duplicate — open in multiple tabs</TooltipContent>
              </Tooltip>
            )}
            {(isAudible || isMuted) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-0.5" data-testid={`audio-badge-${tab.id}`}>
                    {isMuted
                      ? <VolumeX size={9} className="text-muted-foreground/60" strokeWidth={2} />
                      : <Volume2 size={9} className="text-tp-audible" strokeWidth={2} />
                    }
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">{isMuted ? 'Muted' : 'Playing audio'}</TooltipContent>
              </Tooltip>
            )}
            {hasNote && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-0.5" data-testid={`note-badge-${tab.id}`}>
                    <StickyNote size={9} className="text-primary/60" strokeWidth={1.5} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] max-w-[180px]">{tabNote}</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Hover actions: close */}
          <div className="flex items-center gap-0 shrink-0">
            <button
              data-testid={`tab-mute-${tab.id}`}
              onClick={(e) => { e.stopPropagation(); onMute(tab.id); }}
              className={`p-0.5 rounded-[3px] transition-all duration-100 hover:bg-white/10
                ${isAudible || isMuted
                  ? 'text-muted-foreground/60 opacity-0 group-hover:opacity-100'
                  : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100'
                }`}
            >
              {isMuted ? <VolumeX size={11} strokeWidth={1.5} /> : <Volume2 size={11} strokeWidth={1.5} />}
            </button>
            <button
              data-testid={`tab-close-${tab.id}`}
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              className="p-0.5 rounded-[3px] text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10
                opacity-0 group-hover:opacity-100 transition-all duration-100"
            >
              <X size={11} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 font-body text-xs" data-testid={`tab-context-menu-${tab.id}`}>
        {/* Navigation */}
        <ContextMenuItem onClick={() => onSwitch(tab.id)}>Switch to tab</ContextMenuItem>
        <ContextMenuSeparator />

        {/* Tab state */}
        <ContextMenuItem onClick={() => onPin(tab.id)}>
          <Pin size={12} className="mr-1.5" strokeWidth={1.5} />
          {isPinned ? 'Unpin tab' : 'Pin tab'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMute(tab.id)}>
          {isMuted ? <Volume2 size={12} className="mr-1.5" strokeWidth={1.5} /> : <VolumeX size={12} className="mr-1.5" strokeWidth={1.5} />}
          {isMuted ? 'Unmute tab' : 'Mute tab'}
        </ContextMenuItem>
        {isSuspended ? (
          <ContextMenuItem onClick={() => onUnsuspend?.(tab.id)}>Reload tab</ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => onSuspend?.(tab.id)}>Suspend tab</ContextMenuItem>
        )}
        <ContextMenuSeparator />

        {/* Organization */}
        <ContextMenuItem onClick={() => onDuplicate(tab.id)}>Duplicate tab</ContextMenuItem>
        <ContextMenuItem onClick={() => onAddNote?.(tab.id)}>
          <StickyNote size={12} className="mr-1.5" strokeWidth={1.5} />
          {hasNote ? 'Edit note' : 'Add note'}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent className="font-body text-xs">
            {otherWindows.map(w => (
              <ContextMenuItem key={w.id} onClick={() => onMoveToWindow(tab.id, w.id)}>
                Window {w.id} ({w.tabs.length} tabs)
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onMoveToNewWindow(tab.id)}>New Window</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Clipboard */}
        <ContextMenuItem onClick={handleCopyUrl}>
          <Copy size={12} className="mr-1.5" strokeWidth={1.5} /> Copy URL
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Destructive actions */}
        <ContextMenuItem onClick={() => onCloseToRight(tab.id, currentWindowId)} className="text-destructive/70 focus:text-destructive">
          Close tabs to the right
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCloseOthers(tab.id, currentWindowId)} className="text-destructive/70 focus:text-destructive">
          Close other tabs
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onClose(tab.id)} className="text-destructive focus:text-destructive font-semibold">
          Close tab
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
