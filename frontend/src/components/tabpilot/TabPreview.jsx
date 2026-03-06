import { useState, useRef, useEffect } from 'react';
import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { TAB_METRICS, TAB_TIME_MINUTES } from '@/utils/mockData';
import { Clock, HardDrive, Eye, Pin, Volume2, Pause, StickyNote } from 'lucide-react';

const DOMAIN_COLORS = {
  'github.com': '#24292e',
  'stackoverflow.com': '#f48225',
  'mycompany.atlassian.net': '#0052cc',
  'mycompany.slack.com': '#611f69',
  'chat.openai.com': '#10a37f',
  'docs.google.com': '#4285f4',
  'www.youtube.com': '#ff0000',
  'www.reddit.com': '#ff4500',
  'mail.google.com': '#ea4335',
  'www.amazon.com': '#ff9900',
  'x.com': '#000000',
  'www.netflix.com': '#e50914',
};

export function TabPreview({ tab, suspended, tabNote, anchorRect, onClose }) {
  const ref = useRef(null);
  const domain = getDomain(tab.url);
  const faviconUrl = getFaviconUrl(tab.url);
  const metrics = TAB_METRICS[tab.id] || { memory: 80, cpu: 1, visitCount: 5 };
  const timeMin = TAB_TIME_MINUTES[tab.id] || 5;
  const hrs = Math.floor(timeMin / 60);
  const mins = timeMin % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const domainColor = DOMAIN_COLORS[domain] || '#6b7280';

  // Position the preview right at the sidebar's right edge, aligned with the hovered tab
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRect) return;
    const previewH = 200;
    const previewW = 240;

    // Find the sidebar container to anchor preview at its right edge
    const sidebar = document.querySelector('[data-testid="sidebar-container"]');
    const sidebarRight = sidebar ? sidebar.getBoundingClientRect().right : anchorRect.right;

    let top = anchorRect.top;
    let left = sidebarRight + 8; // Just past the sidebar edge

    // Keep within viewport vertically
    if (top + previewH > window.innerHeight) {
      top = window.innerHeight - previewH - 8;
    }
    if (top < 8) top = 8;

    // If goes off right edge, flip left of sidebar
    if (left + previewW > window.innerWidth) {
      left = (sidebar ? sidebar.getBoundingClientRect().left : anchorRect.left) - previewW - 8;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  return (
    <div
      ref={ref}
      className="fixed z-50 w-[240px] bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-in"
      style={{ top: position.top, left: position.left }}
      onMouseLeave={onClose}
      data-testid={`tab-preview-${tab.id}`}
    >
      {/* Visual preview — mock browser screenshot */}
      <div className="relative overflow-hidden" style={{ height: '90px', background: `linear-gradient(135deg, ${domainColor}60, ${domainColor}20)` }}>
        {/* Mock browser chrome bar */}
        <div className="absolute top-0 left-0 right-0 h-5 bg-black/30 backdrop-blur-sm flex items-center gap-1.5 px-2">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 h-2.5 bg-white/10 rounded-sm flex items-center px-1">
            <span className="text-[5px] text-white/50 truncate">{tab.url}</span>
          </div>
        </div>
        {/* Main content area */}
        <div className="absolute inset-0 top-5 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <img src={faviconUrl} alt="" className="w-8 h-8 rounded-lg shadow-lg"
              onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="text-[8px] text-white/60 font-mono">{domain}</span>
          </div>
          {/* Subtle content lines */}
          <div className="absolute bottom-3 left-3 right-3 space-y-0.5">
            <div className="h-0.5 bg-white/10 rounded-full w-full" />
            <div className="h-0.5 bg-white/10 rounded-full w-4/5" />
            <div className="h-0.5 bg-white/10 rounded-full w-3/5" />
          </div>
        </div>
        {/* Status badges */}
        <div className="absolute top-6 right-1.5 flex gap-0.5">
          {tab.pinned && (
            <div className="p-0.5 rounded bg-black/30 backdrop-blur-sm">
              <Pin size={8} className="text-tp-pinned" strokeWidth={2} />
            </div>
          )}
          {tab.audible && !tab.mutedInfo?.muted && (
            <div className="p-0.5 rounded bg-black/30 backdrop-blur-sm">
              <Volume2 size={8} className="text-tp-audible" strokeWidth={2} />
            </div>
          )}
          {suspended && (
            <div className="p-0.5 rounded bg-black/30 backdrop-blur-sm">
              <Pause size={8} className="text-blue-400" strokeWidth={2} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-2">
        {/* Title + URL */}
        <div>
          <div className="text-[11px] font-body font-medium leading-tight line-clamp-2">{tab.title}</div>
          <div className="text-[9px] text-muted-foreground/50 truncate mt-0.5">{tab.url}</div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <HardDrive size={8} strokeWidth={1.5} />
            <span>{metrics.memory}MB</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Clock size={8} strokeWidth={1.5} />
            <span>{timeStr}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Eye size={8} strokeWidth={1.5} />
            <span>{metrics.visitCount} visits</span>
          </div>
        </div>

        {/* Note */}
        {tabNote && (
          <div className="flex items-start gap-1.5 p-1.5 rounded-md bg-primary/[0.06] border border-primary/10">
            <StickyNote size={9} className="text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
            <span className="text-[9px] text-foreground/70 leading-relaxed">{tabNote}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage tab preview state
 */
export function useTabPreview() {
  const [preview, setPreview] = useState(null);
  const timerRef = useRef(null);

  const showPreview = (tab, event, extraProps = {}) => {
    clearTimeout(timerRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    timerRef.current = setTimeout(() => {
      setPreview({ tab, anchorRect: rect, ...extraProps });
    }, 350);
  };

  const hidePreview = () => {
    clearTimeout(timerRef.current);
    setPreview(null);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return { preview, showPreview, hidePreview };
}
