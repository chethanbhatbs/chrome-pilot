import { Monitor, FileText, Volume2, Pin, AlertTriangle, HardDrive, Cpu, Pause } from 'lucide-react';
import { TAB_METRICS } from '@/utils/mockData';

export function StatsBar({ windows, allTabs, suspendedCount = 0 }) {
  const tabCount = allTabs.length;
  const audibleCount = allTabs.filter(t => t.audible && !t.mutedInfo?.muted).length;
  const pinnedCount = allTabs.filter(t => t.pinned).length;

  const totalMemory = allTabs.reduce((sum, t) => sum + (TAB_METRICS[t.id]?.memory || 80), 0);
  const avgCpu = allTabs.length > 0
    ? (allTabs.reduce((sum, t) => sum + (TAB_METRICS[t.id]?.cpu || 1), 0) / allTabs.length).toFixed(1)
    : 0;

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

  const memoryStr = totalMemory >= 1024 ? `${(totalMemory / 1024).toFixed(1)}G` : `${totalMemory}M`;

  return (
    <div
      className="flex items-center justify-between px-2.5 py-1.5 border-t border-border bg-card/50 text-[9px] font-mono"
      data-testid="stats-bar"
    >
      <div className="flex items-center gap-0.5 text-foreground/60">
        <FileText size={9} strokeWidth={1.5} />
        <span>{tabCount}</span>
      </div>
      <div className={`flex items-center gap-0.5 ${totalMemory > 2000 ? 'text-amber-400' : 'text-muted-foreground'}`}>
        <HardDrive size={9} strokeWidth={1.5} />
        <span>{memoryStr}</span>
      </div>
      <div className={`flex items-center gap-0.5 ${parseFloat(avgCpu) > 10 ? 'text-amber-400' : 'text-muted-foreground'}`}>
        <Cpu size={9} strokeWidth={1.5} />
        <span>{avgCpu}%</span>
      </div>
      <div className={`flex items-center gap-0.5 ${audibleCount > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
        <Volume2 size={9} strokeWidth={1.5} />
        <span>{audibleCount}</span>
      </div>
      {suspendedCount > 0 && (
        <div className="flex items-center gap-0.5 text-blue-400">
          <Pause size={9} strokeWidth={1.5} />
          <span>{suspendedCount}</span>
        </div>
      )}
      <div className={`flex items-center gap-0.5 ${dupCount > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
        <AlertTriangle size={9} strokeWidth={1.5} />
        <span>{dupCount}</span>
      </div>
    </div>
  );
}
