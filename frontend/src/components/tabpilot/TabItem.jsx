import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { Pin, Volume2, VolumeX, X, Loader2, GripVertical, Copy } from 'lucide-react';
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
  tab, isActive, showFavicons, showUrls, compact,
  highlightText, onSwitch, onClose, onPin, onMute, onDuplicate,
  onMoveToNewWindow, onMoveToWindow, onCloseOthers, onCloseToRight,
  windows, currentWindowId,
  onDragStart, onDragOver, onDrop, onDragEnd
}) {
  const domain = getDomain(tab.url);
  const faviconUrl = showFavicons ? getFaviconUrl(tab.url) : null;
  const isLoading = tab.status === 'loading';
  const isPinned = tab.pinned;
  const isAudible = tab.audible && !tab.mutedInfo?.muted;
  const isMuted = tab.mutedInfo?.muted;

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
          onClick={() => onSwitch(tab.id)}
          className={`group flex items-center gap-1.5 cursor-pointer rounded-md transition-all duration-150 select-none
            ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'}
            ${isActive
              ? 'bg-accent border-l-2 border-primary text-accent-foreground'
              : 'hover:bg-white/5 text-foreground/80 border-l-2 border-transparent'
            }
            ${isPinned ? 'bg-secondary/50' : ''}
          `}
        >
          <GripVertical
            size={10}
            className="opacity-0 group-hover:opacity-40 shrink-0 cursor-grab text-muted-foreground"
            strokeWidth={1.5}
          />

          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
            {isLoading ? (
              <Loader2 size={12} className="animate-spin text-primary" strokeWidth={1.5} />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded-sm" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-body leading-tight truncate">
              {highlightText ? highlightText(tab.title) : tab.title}
            </div>
            {showUrls && (
              <div className="text-[10px] text-muted-foreground truncate leading-tight">
                {highlightText ? highlightText(domain) : domain}
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {isPinned && (
              <Pin size={10} className="text-tp-pinned" strokeWidth={2} />
            )}
            {(isAudible || isMuted) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid={`tab-mute-${tab.id}`}
                    onClick={(e) => { e.stopPropagation(); onMute(tab.id); }}
                    className={`p-0.5 rounded transition-colors ${isAudible ? 'text-tp-audible animate-pulse-glow' : 'text-muted-foreground'} hover:bg-white/10`}
                  >
                    {isMuted ? <VolumeX size={10} strokeWidth={1.5} /> : <Volume2 size={10} strokeWidth={1.5} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[10px]">
                  {isMuted ? 'Unmute' : 'Mute'}
                </TooltipContent>
              </Tooltip>
            )}

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isPinned && !isAudible && !isMuted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      data-testid={`tab-pin-${tab.id}`}
                      onClick={(e) => { e.stopPropagation(); onPin(tab.id); }}
                      className="p-0.5 rounded text-muted-foreground hover:text-tp-pinned hover:bg-white/10 transition-colors"
                    >
                      <Pin size={10} strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-[10px]">Pin</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid={`tab-close-${tab.id}`}
                    onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                    className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X size={10} strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[10px]">Close</TooltipContent>
              </Tooltip>
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
