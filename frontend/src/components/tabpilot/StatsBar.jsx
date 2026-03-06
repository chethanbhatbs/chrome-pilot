import { Monitor, FileText, Volume2, Pin, AlertTriangle } from 'lucide-react';

export function StatsBar({ windows, allTabs }) {
  const windowCount = windows.length;
  const tabCount = allTabs.length;
  const audibleCount = allTabs.filter(t => t.audible && !t.mutedInfo?.muted).length;
  const pinnedCount = allTabs.filter(t => t.pinned).length;

  const urlMap = {};
  let dupCount = 0;
  allTabs.forEach(t => {
    try {
      const u = new URL(t.url);
      const normalized = u.origin + u.pathname.replace(/\/$/, '') + u.search;
      if (urlMap[normalized]) dupCount++;
      else urlMap[normalized] = true;
    } catch { /* skip */ }
  });

  const stats = [
    { icon: Monitor, value: windowCount, color: 'text-primary' },
    { icon: FileText, value: tabCount, color: 'text-foreground/70' },
    { icon: Volume2, value: audibleCount, color: audibleCount > 0 ? 'text-tp-audible' : 'text-muted-foreground' },
    { icon: Pin, value: pinnedCount, color: pinnedCount > 0 ? 'text-tp-pinned' : 'text-muted-foreground' },
    { icon: AlertTriangle, value: dupCount, color: dupCount > 0 ? 'text-tp-duplicate' : 'text-muted-foreground' },
  ];

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 border-t border-border/50 bg-card/80 backdrop-blur-sm"
      data-testid="stats-bar"
    >
      {stats.map(({ icon: Icon, value, color }, i) => (
        <div key={i} className={`flex items-center gap-1 ${color}`}>
          <Icon size={11} strokeWidth={1.5} />
          <span className="text-[10px] font-mono font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
