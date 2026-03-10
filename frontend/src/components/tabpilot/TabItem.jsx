import { getDomain, getFaviconUrl, handleFaviconError, getLetterAvatar } from '@/utils/grouping';
import { Pin, Volume2, VolumeX, X, Loader2, Copy, StickyNote, GripVertical, Pause, Check } from 'lucide-react';
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
  onDragStart, onDragEnd,
  onHoverEnter, onHoverLeave,
  selectMode, isSelected, onToggleSelect
}) {
  const domain = getDomain(tab.url);
  const faviconUrl = showFavicons ? getFaviconUrl(tab.url, tab.favIconUrl) : null;
  const avatar = !faviconUrl ? getLetterAvatar(tab.url) : null;
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
          onDragEnd={onDragEnd}
          onMouseEnter={(e) => onHoverEnter?.(tab, e)}
          onMouseLeave={() => onHoverLeave?.()}
          onClick={() => {
            if (selectMode) { onToggleSelect?.(tab.id); return; }
            if (isSuspended) onUnsuspend?.(tab.id);
            onSwitch(tab.id);
          }}
          className={`group flex items-center gap-1.5 cursor-pointer transition-all duration-150 select-none relative
            ${compact ? 'px-2 py-[3px]' : 'px-2 py-[5px]'}
            ${isActive
              ? 'bg-primary/[0.10] text-foreground'
              : 'hover:bg-[hsl(var(--hover-subtle))] text-foreground/75'
            }
            ${isSuspended ? 'opacity-35' : ''}
          `}
        >
          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full bg-primary active-tab-glow" />
          )}

          {/* Select checkbox or drag handle */}
          {selectMode ? (
            <div
              className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-all duration-150
                ${isSelected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                }`}
              data-testid={`select-checkbox-${tab.id}`}
            >
              {isSelected && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0 cursor-grab active:cursor-grabbing"
              data-testid={`drag-handle-${tab.id}`}
            >
              <GripVertical size={10} strokeWidth={1.5} />
            </div>
          )}

          {/* Favicon + status indicators */}
          <div className="w-4 h-4 shrink-0 flex items-center justify-center relative rounded bg-secondary/50">
            {isLoading ? (
              <Loader2 size={12} className="animate-spin text-primary" strokeWidth={1.5} />
            ) : isSuspended ? (
              <Pause size={12} className="text-muted-foreground/40" strokeWidth={1.5} />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded-[3px]" data-tab-url={tab.url} data-chrome-favicon={tab.favIconUrl || ''} onError={handleFaviconError} />
            ) : (
              <div className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[9px] font-bold"
                style={{ background: avatar?.color.bg, color: avatar?.color.fg }}
              >{avatar?.letter}</div>
            )}
          </div>

          {/* Title + URL */}
          <div className="flex-1 min-w-0">
            <div className={`font-body leading-tight truncate ${compact ? 'text-[11px]' : 'text-[11.5px]'}`}>
              {highlightText ? highlightText(tab.title) : tab.title}
            </div>
            {showUrls && !compact && (
              <div className="text-[10px] text-muted-foreground/60 truncate leading-tight mt-0.5">
                {highlightText ? highlightText(domain) : domain}
              </div>
            )}
          </div>

          {/* Status badges — always visible when applicable */}
          <div className="flex items-center gap-0 shrink-0">
            {isPinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="cursor-pointer p-1 rounded-md hover:bg-tp-pinned/20 transition-colors active:scale-90"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onPin(tab.id); }}
                    data-testid={`pin-badge-${tab.id}`}
                  >
                    <Pin size={11} className="text-tp-pinned" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">Click to unpin</TooltipContent>
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

          {/* Hover actions: note + close (+ mute for audible/muted tabs) */}
          <div className="flex items-center gap-0 shrink-0">
            {/* Note button — only shown on hover when there's no note (badge handles the "has note" case) */}
            {!hasNote && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid={`tab-note-btn-${tab.id}`}
                    onClick={(e) => { e.stopPropagation(); onAddNote?.(tab.id); }}
                    className="cursor-pointer p-0.5 rounded-[3px] transition-all duration-150 hover:bg-[hsl(var(--hover-medium))]
                      opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-foreground/60"
                  >
                    <StickyNote size={11} strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] font-body">Add note</TooltipContent>
              </Tooltip>
            )}
            {(isAudible || isMuted) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid={`tab-mute-${tab.id}`}
                    onClick={(e) => { e.stopPropagation(); onMute(tab.id); }}
                    className={`cursor-pointer p-0.5 rounded-[3px] transition-all duration-150 hover:bg-[hsl(var(--hover-medium))]
                      ${isAudible ? 'text-tp-audible' : 'text-muted-foreground/60'}`}
                  >
                    {isMuted ? <VolumeX size={11} strokeWidth={1.5} /> : <Volume2 size={11} strokeWidth={1.5} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">{isMuted ? 'Unmute tab' : 'Mute tab'}</TooltipContent>
              </Tooltip>
            )}
            <button
              data-testid={`tab-close-${tab.id}`}
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              className="cursor-pointer p-0.5 rounded-[3px] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10
                opacity-0 group-hover:opacity-100 transition-all duration-150"
            >
              <X size={11} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 font-body text-xs" data-testid={`tab-context-menu-${tab.id}`}>
        {/* Navigation */}
        <ContextMenuItem className="cursor-pointer" onClick={() => onSwitch(tab.id)}>Switch to tab</ContextMenuItem>
        <ContextMenuSeparator />

        {/* Tab state */}
        <ContextMenuItem className="cursor-pointer" onClick={() => onPin(tab.id)}>
          <Pin size={12} className="mr-1.5" strokeWidth={1.5} />
          {isPinned ? 'Unpin tab' : 'Pin tab'}
        </ContextMenuItem>
        <ContextMenuItem className="cursor-pointer" onClick={() => onMute(tab.id)}>
          {isMuted ? <Volume2 size={12} className="mr-1.5" strokeWidth={1.5} /> : <VolumeX size={12} className="mr-1.5" strokeWidth={1.5} />}
          {isMuted ? 'Unmute tab' : 'Mute tab'}
        </ContextMenuItem>
        {isSuspended ? (
          <ContextMenuItem className="cursor-pointer" onClick={() => onUnsuspend?.(tab.id)}>Reload tab</ContextMenuItem>
        ) : (
          <ContextMenuItem className="cursor-pointer" onClick={() => onSuspend?.(tab.id)}>Suspend tab</ContextMenuItem>
        )}
        <ContextMenuSeparator />

        {/* Organization */}
        <ContextMenuItem className="cursor-pointer" onClick={() => onDuplicate(tab.id)}>
          <Copy size={12} className="mr-1.5" strokeWidth={1.5} />
          Duplicate tab
        </ContextMenuItem>
        <ContextMenuItem className="cursor-pointer" onClick={() => onAddNote?.(tab.id)}>
          <StickyNote size={12} className="mr-1.5" strokeWidth={1.5} />
          {hasNote ? 'Edit note' : 'Add note'}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent className="font-body text-xs">
            {isPinned ? (
              <ContextMenuItem className="text-muted-foreground cursor-default" disabled>
                Pinned tabs cannot be moved. Unpin first.
              </ContextMenuItem>
            ) : (
              <>
                {otherWindows.map(w => (
                  <ContextMenuItem className="cursor-pointer" key={w.id} onClick={() => onMoveToWindow(tab.id, w.id)}>
                    {w.name || 'Window'} ({w.tabs.length} tabs)
                  </ContextMenuItem>
                ))}
                <ContextMenuSeparator />
                <ContextMenuItem className="cursor-pointer" onClick={() => onMoveToNewWindow(tab.id)}>New Window</ContextMenuItem>
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Clipboard */}
        <ContextMenuItem className="cursor-pointer" onClick={handleCopyUrl}>
          <Copy size={12} className="mr-1.5" strokeWidth={1.5} /> Copy URL
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Destructive actions */}
        <ContextMenuItem onClick={() => onCloseToRight(tab.id, currentWindowId)} className="cursor-pointer text-destructive/70 focus:text-destructive">
          Close tabs to the right
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCloseOthers(tab.id, currentWindowId)} className="cursor-pointer text-destructive/70 focus:text-destructive">
          Close other tabs
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onClose(tab.id)} className="cursor-pointer text-destructive focus:text-destructive font-semibold">
          Close tab
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
