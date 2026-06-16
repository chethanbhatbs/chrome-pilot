import { FileText, Volume2, Pause, AlertTriangle } from 'lucide-react';
import { normalizeUrl } from '@/utils/grouping';

export function StatsBar({ allTabs, suspendedCount = 0, dupCount: dupCountProp }) {
  const tabCount = allTabs.length;
  const audibleCount = allTabs.filter(t => t.audible && !t.mutedInfo?.muted).length;

  // Use the count the parent already computed; only fall back to a local pass
  // (via the shared normalizeUrl rule) if it wasn't provided.
  const dupCount = dupCountProp ?? (() => {
    const urlMap = {};
    let d = 0;
    allTabs.forEach(t => {
      if (!t.url) return;
      const n = normalizeUrl(t.url);
      if (!n) return;
      if (urlMap[n]) d++;
      else urlMap[n] = true;
    });
    return d;
  })();

  const stats = [
    { icon: FileText, label: 'Tabs', value: tabCount, color: 'text-primary', valColor: 'text-foreground' },
    { icon: Volume2, label: 'Audio', value: audibleCount, color: audibleCount > 0 ? 'text-emerald-500' : 'text-muted-foreground/60', valColor: audibleCount > 0 ? 'text-emerald-500' : 'text-muted-foreground/70' },
    { icon: Pause, label: 'Paused', value: suspendedCount, color: suspendedCount > 0 ? 'text-amber-500' : 'text-muted-foreground/60', valColor: suspendedCount > 0 ? 'text-amber-500' : 'text-muted-foreground/70' },
    { icon: AlertTriangle, label: 'Dupes', value: dupCount, color: dupCount > 0 ? 'text-rose-500' : 'text-muted-foreground/60', valColor: dupCount > 0 ? 'text-rose-500' : 'text-muted-foreground/70' },
  ];

  return (
    <div className="border-t border-border/50 bg-card/50" data-testid="stats-bar">
      <div className="grid grid-cols-4 gap-0 px-1.5 py-1.5">
        {stats.map(({ icon: Icon, label, value, color, valColor }) => (
          <div key={label} className="flex flex-col items-center gap-0 cursor-default" data-testid={`stat-${label.toLowerCase()}`}>
            <div className="flex items-center gap-0.5">
              <Icon size={9} strokeWidth={1.5} className={color} />
              <span className={`text-[11px] ${color}`}>{label}</span>
            </div>
            <span className={`text-[10px] tabular-nums font-mono font-semibold ${valColor}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
