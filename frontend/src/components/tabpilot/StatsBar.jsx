import { Monitor, FileText, Volume2, Pin, AlertTriangle, HardDrive, Cpu } from 'lucide-react';
import { TAB_METRICS } from '@/utils/mockData';

export function StatsBar({ windows, allTabs }) {
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

  const memoryStr = totalMemory >= 1024 ? `${(totalMemory / 1024).toFixed(1)} GB` : `${totalMemory} MB`;

  return (
    <div
      className="grid grid-cols-6 gap-1 px-2 py-1.5 border-t border-border/50 bg-card/50"
      data-testid="stats-bar"
    >
      <StatItem icon={FileText} value={tabCount} label="tabs" color="text-foreground/60" />
      <StatItem icon={HardDrive} value={memoryStr} color={totalMemory > 2000 ? 'text-tp-duplicate' : 'text-primary/70'} />
      <StatItem icon={Cpu} value={`${avgCpu}%`} color={parseFloat(avgCpu) > 10 ? 'text-tp-duplicate' : 'text-muted-foreground'} />
      <StatItem icon={Volume2} value={audibleCount} color={audibleCount > 0 ? 'text-tp-audible' : 'text-muted-foreground/40'} />
      <StatItem icon={Pin} value={pinnedCount} color={pinnedCount > 0 ? 'text-tp-pinned' : 'text-muted-foreground/40'} />
      <StatItem icon={AlertTriangle} value={dupCount} color={dupCount > 0 ? 'text-tp-duplicate' : 'text-muted-foreground/40'} />
    </div>
  );
}

function StatItem({ icon: Icon, value, color }) {
  return (
    <div className={`flex items-center justify-center gap-1 ${color}`}>
      <Icon size={10} strokeWidth={1.5} />
      <span className="text-[9px] font-mono font-medium">{value}</span>
    </div>
  );
}
