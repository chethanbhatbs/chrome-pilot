import { FileText, HardDrive, Cpu, Volume2, Pause, AlertTriangle } from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip';
import { TAB_METRICS } from '@/utils/mockData';

export function StatsBar({ windows, allTabs, suspendedCount = 0 }) {
  const tabCount = allTabs.length;
  const audibleCount = allTabs.filter(t => t.audible && !t.mutedInfo?.muted).length;

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

  const stats = [
    { icon: FileText, label: 'Tabs', value: tabCount, color: 'text-foreground/70', always: true },
    { icon: HardDrive, label: 'Mem', value: memoryStr, color: totalMemory > 2000 ? 'text-primary/80' : 'text-muted-foreground', always: true },
    { icon: Cpu, label: 'CPU', value: `${avgCpu}%`, color: parseFloat(avgCpu) > 10 ? 'text-primary/80' : 'text-muted-foreground', always: true },
    { icon: Volume2, label: 'Audio', value: audibleCount, color: audibleCount > 0 ? 'text-emerald-400' : 'text-muted-foreground', always: true },
    { icon: Pause, label: 'Paused', value: suspendedCount, color: 'text-primary/70', always: suspendedCount > 0 },
    { icon: AlertTriangle, label: 'Dupes', value: dupCount, color: dupCount > 0 ? 'text-rose-400/80' : 'text-muted-foreground', always: true },
  ];

  return (
    <div
      className="flex items-center justify-between px-2.5 py-1.5 border-t border-border bg-card/50 text-[10px] font-mono"
      data-testid="stats-bar"
    >
      {stats.filter(s => s.always).map(({ icon: Icon, label, value, color }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${color} cursor-default`} data-testid={`stat-${label.toLowerCase()}`}>
              <Icon size={10} strokeWidth={1.5} />
              <span className="opacity-50">{label}:</span>
              <span>{value}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] font-body">{label}: {value}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
