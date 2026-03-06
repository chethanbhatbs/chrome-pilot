import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { Pin, Volume2, VolumeX, X, Loader2, Copy } from 'lucide-react';
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
  onSuspend, onUnsuspend,
  windows, currentWindowId,
  onDragStart, onDragOver, onDrop, onDragEnd
}) {
  const domain = getDomain(tab.url);
  const faviconUrl = showFavicons ? getFaviconUrl(tab.url) : null;
  const isLoading = tab.status === 'loading';
  const isPinned = tab.pinned;
  const isAudible = tab.audible && !tab.mutedInfo?.muted;
  const isMuted = tab.mutedInfo?.muted;
  const isSuspended = suspended;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tab.url);
    toast.success('URL copied');
  };
  const handleCopyTitleUrl = () => {
    navigator.clipboard.writeText(`${tab.title}\n${tab.url}`);
    toast.success('Title & URL copied');
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
          className={`group flex items-center gap-2.5 cursor-pointer transition-all duration-150 select-none relative
            ${compact ? 'px-3 py-[3px]' : 'px-3 py-1.5'}
            ${isActive
              ? 'bg-primary/[0.08] text-foreground'
              : 'hover:bg-muted/50 text-foreground/75'
            }
            ${isSuspended ? 'opacity-40' : ''}
          `}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3.5 rounded-r-full bg-primary" />
          )}

          <div className="w-4 h-4 shrink-0 flex items-center justify-center relative">
            {isLoading ? (
              <Loader2 size={13} className="animate-spin text-primary" strokeWidth={1.5} />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded-[3px]" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-3.5 h-3.5 rounded-[3px] bg-muted-foreground/20" />
            )}
            {isPinned && (
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-tp-pinned" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className={`font-body leading-tight truncate ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
              {highlightText ? highlightText(tab.title) : tab.title}
              {isSuspended && <span className="text-[9px] text-muted-foreground ml-1">(suspended)</span>}
            </div>
            {showUrls && !compact && (
              <div className="text-[10px] text-muted-foreground/60 truncate leading-tight mt-0.5">
                {highlightText ? highlightText(domain) : domain}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(isAudible || isMuted) && (
              <button
                data-testid={`tab-mute-${tab.id}`}
                onClick={(e) => { e.stopPropagation(); onMute(tab.id); }}
                className={`p-0.5 rounded-[3px] transition-colors
                  ${isAudible ? 'text-tp-audible animate-pulse-glow' : 'text-muted-foreground'}
                  hover:bg-white/10`}
              >
                {isMuted ? <VolumeX size={11} strokeWidth={1.5} /> : <Volume2 size={11} strokeWidth={1.5} />}
              </button>
            )}

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                data-testid={`tab-close-${tab.id}`}
                onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                className="p-0.5 rounded-[3px] text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X size={11} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 font-body text-xs" data-testid={`tab-context-menu-${tab.id}`}>
        <ContextMenuItem onClick={() => onSwitch(tab.id)} data-testid={`ctx-switch-${tab.id}`}>
          Switch to tab
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onPin(tab.id)} data-testid={`ctx-pin-${tab.id}`}>
          {isPinned ? 'Unpin' : 'Pin'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMute(tab.id)} data-testid={`ctx-mute-${tab.id}`}>
          {isMuted ? 'Unmute' : 'Mute'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(tab.id)} data-testid={`ctx-duplicate-${tab.id}`}>
          Duplicate
        </ContextMenuItem>
        {isSuspended ? (
          <ContextMenuItem onClick={() => onUnsuspend?.(tab.id)} data-testid={`ctx-unsuspend-${tab.id}`}>
            Reload tab
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => onSuspend?.(tab.id)} data-testid={`ctx-suspend-${tab.id}`}>
            Suspend tab
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger data-testid={`ctx-move-${tab.id}`}>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent className="font-body text-xs">
            {otherWindows.map(w => (
              <ContextMenuItem
                key={w.id}
                onClick={() => onMoveToWindow(tab.id, w.id)}
                data-testid={`ctx-move-win-${w.id}`}
              >
                Window {w.id} ({w.tabs.length} tabs)
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onMoveToNewWindow(tab.id)} data-testid={`ctx-move-new-${tab.id}`}>
              New Window
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onCloseToRight(tab.id, currentWindowId)} data-testid={`ctx-close-right-${tab.id}`}>
          Close tabs to the right
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCloseOthers(tab.id, currentWindowId)} data-testid={`ctx-close-others-${tab.id}`}>
          Close other tabs
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyUrl} data-testid={`ctx-copy-url-${tab.id}`}>
          <Copy size={12} className="mr-1.5" strokeWidth={1.5} /> Copy URL
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyTitleUrl} data-testid={`ctx-copy-both-${tab.id}`}>
          <Copy size={12} className="mr-1.5" strokeWidth={1.5} /> Copy title + URL
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onClose(tab.id)}
          className="text-destructive focus:text-destructive"
          data-testid={`ctx-close-${tab.id}`}
        >
          Close
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
