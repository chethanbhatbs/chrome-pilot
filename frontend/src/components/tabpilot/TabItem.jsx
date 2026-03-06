import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { Pin, Volume2, VolumeX, X, Loader2, Copy, StickyNote } from 'lucide-react';
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
  tab, isActive, showFavicons, showUrls, compact, suspended,
  highlightText, onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToNewWindow, onMoveToWindow, onCloseOthers, onCloseToRight,
  onSuspend, onUnsuspend, onAddNote,
  windows, currentWindowId, tabNote,
  onDragStart, onDragOver, onDrop, onDragEnd
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
          onClick={() => {
            if (isSuspended) { onUnsuspend?.(tab.id); }
            onSwitch(tab.id);
          }}
          className={`group flex items-center gap-2 cursor-pointer transition-all duration-100 select-none relative
            ${compact ? 'px-2.5 py-[3px]' : 'px-2.5 py-[5px]'}
            ${isActive
              ? 'bg-primary/[0.08] text-foreground'
              : 'hover:bg-white/[0.04] text-foreground/75'
            }
            ${isSuspended ? 'opacity-40' : ''}
          `}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-r-full bg-primary" />
          )}

          {/* Favicon */}
          <div className="w-4 h-4 shrink-0 flex items-center justify-center relative">
            {isLoading ? (
              <Loader2 size={12} className="animate-spin text-primary" strokeWidth={1.5} />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded-[3px]" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-3.5 h-3.5 rounded-[3px] bg-muted-foreground/20" />
            )}
            {isPinned && (
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-tp-pinned" />
            )}
            {hasNote && (
              <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </div>

          {/* Title + URL */}
          <div className="flex-1 min-w-0">
            <div className={`font-body leading-tight truncate ${compact ? 'text-[11px]' : 'text-[11.5px]'}`}>
              {highlightText ? highlightText(tab.title) : tab.title}
              {isSuspended && <span className="text-[9px] text-muted-foreground ml-1.5 opacity-60">(suspended)</span>}
            </div>
            {showUrls && !compact && (
              <div className="text-[10px] text-muted-foreground/50 truncate leading-tight mt-0.5">
                {highlightText ? highlightText(domain) : domain}
              </div>
            )}
          </div>

          {/* Right actions — always show mute on hover */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Mute/unmute — always visible on hover, always visible if audible/muted */}
            <button
              data-testid={`tab-mute-${tab.id}`}
              onClick={(e) => { e.stopPropagation(); onMute(tab.id); }}
              className={`p-0.5 rounded-[3px] transition-all duration-100
                ${isAudible
                  ? 'text-tp-audible opacity-100'
                  : isMuted
                    ? 'text-muted-foreground opacity-100'
                    : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100'
                }
                hover:bg-white/10`}
            >
              {isMuted ? <VolumeX size={11} strokeWidth={1.5} /> : <Volume2 size={11} strokeWidth={1.5} />}
            </button>

            {/* Close — on hover */}
            <button
              data-testid={`tab-close-${tab.id}`}
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              className="p-0.5 rounded-[3px] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10
                opacity-0 group-hover:opacity-100 transition-all duration-100"
            >
              <X size={11} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 font-body text-xs" data-testid={`tab-context-menu-${tab.id}`}>
        <ContextMenuItem onClick={() => onSwitch(tab.id)}>Switch to tab</ContextMenuItem>
        <ContextMenuItem onClick={() => onPin(tab.id)}>{isPinned ? 'Unpin' : 'Pin'}</ContextMenuItem>
        <ContextMenuItem onClick={() => onMute(tab.id)}>{isMuted ? 'Unmute' : 'Mute'}</ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(tab.id)}>Duplicate</ContextMenuItem>
        {isSuspended ? (
          <ContextMenuItem onClick={() => onUnsuspend?.(tab.id)}>Reload tab</ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => onSuspend?.(tab.id)}>Suspend tab</ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onAddNote?.(tab.id)}>
          <StickyNote size={12} className="mr-1.5" strokeWidth={1.5} />
          {hasNote ? 'Edit note' : 'Add note'}
        </ContextMenuItem>
        <ContextMenuSeparator />
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
        <ContextMenuItem onClick={() => onCloseToRight(tab.id, currentWindowId)}>Close tabs to the right</ContextMenuItem>
        <ContextMenuItem onClick={() => onCloseOthers(tab.id, currentWindowId)}>Close other tabs</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyUrl}>
          <Copy size={12} className="mr-1.5" strokeWidth={1.5} /> Copy URL
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onClose(tab.id)} className="text-destructive focus:text-destructive">Close</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
