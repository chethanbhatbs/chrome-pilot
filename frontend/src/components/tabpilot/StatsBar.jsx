import { useState, useEffect } from 'react';
import { FileText, HardDrive, Cpu, Volume2, Pause, AlertTriangle } from 'lucide-react';
import { TAB_METRICS } from '@/utils/mockData';

export function StatsBar({ allTabs, suspendedCount = 0 }) {
  const tabCount = allTabs.length;
  const audibleCount = allTabs.filter(t => t.audible && !t.mutedInfo?.muted).length;

  // Base values from mock data
  const baseMem = allTabs.reduce((s, t) => s + (TAB_METRICS[t.id]?.memory || 80), 0);
  const baseAvgCpu = allTabs.length > 0
    ? allTabs.reduce((s, t) => s + (TAB_METRICS[t.id]?.cpu || 1), 0) / allTabs.length
    : 0;

  const [liveMem, setLiveMem] = useState(baseMem);
  const [liveCpu, setLiveCpu] = useState(baseAvgCpu);

  // Update every second with small fluctuations
  useEffect(() => {
    const tick = () => {
      setLiveMem(prev => Math.max(200, prev + (Math.random() - 0.45) * 180));
      setLiveCpu(prev => Math.max(0.1, Math.min(99.9, prev + (Math.random() - 0.5) * 1.5)));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [allTabs.length]);

  // Sync when tab count changes
  useEffect(() => {
    setLiveMem(baseMem);
    setLiveCpu(baseAvgCpu);
  }, [allTabs.length]);

  const dupCount = (() => {
    const urlMap = {};
    let d = 0;
    allTabs.forEach(t => {
      try {
        const u = new URL(t.url);
        const n = u.origin + u.pathname.replace(/\/$/, '') + u.search;
        if (urlMap[n]) d++;
        else urlMap[n] = true;
      } catch { /* skip */ }
    });
    return d;
  })();

  const memoryStr = liveMem >= 1024
    ? `${(liveMem / 1024).toFixed(1)}G`
    : `${Math.round(liveMem)}M`;

  const stats = [
    { icon: FileText, label: 'Tabs', value: tabCount, color: 'text-foreground/70', always: true },
    { icon: HardDrive, label: 'Mem', value: memoryStr, color: liveMem > 2000 ? 'text-primary/80' : 'text-muted-foreground', always: true },
    { icon: Cpu, label: 'CPU', value: `${liveCpu.toFixed(1)}%`, color: liveCpu > 10 ? 'text-primary/80' : 'text-muted-foreground', always: true },
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
        <div key={label} className={`flex items-center gap-1 ${color} cursor-default`} data-testid={`stat-${label.toLowerCase()}`}>
          <Icon size={10} strokeWidth={1.5} />
          <span className="opacity-50">{label}:</span>
          <span className="tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}
