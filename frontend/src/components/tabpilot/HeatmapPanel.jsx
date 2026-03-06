import { Flame, Zap, TrendingUp } from 'lucide-react';
import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { TAB_METRICS } from '@/utils/mockData';
import { useMemo } from 'react';
import { toast } from 'sonner';

function getHeatColor(ratio) {
  if (ratio > 0.8) return { bar: 'bg-red-500', text: 'text-red-400' };
  if (ratio > 0.6) return { bar: 'bg-orange-500', text: 'text-orange-400' };
  if (ratio > 0.4) return { bar: 'bg-amber-500', text: 'text-amber-400' };
  if (ratio > 0.2) return { bar: 'bg-cyan-500/80', text: 'text-cyan-400' };
  return { bar: 'bg-cyan-800/50', text: 'text-muted-foreground' };
}

export function HeatmapPanel({ allTabs, visitCounts, onSwitch }) {
  const rankedTabs = useMemo(() => {
    const tabsWithVisits = allTabs.map(tab => ({
      ...tab,
      visits: (visitCounts[tab.id] || 0) + (TAB_METRICS[tab.id]?.visitCount || 0),
      memory: TAB_METRICS[tab.id]?.memory || 80,
      cpu: TAB_METRICS[tab.id]?.cpu || 1,
    }));
    return tabsWithVisits.sort((a, b) => b.visits - a.visits);
  }, [allTabs, visitCounts]);

  const maxVisits = rankedTabs[0]?.visits || 1;

  const suggestedTabs = rankedTabs.slice(0, 5);

  const domainHeat = useMemo(() => {
    const map = {};
    rankedTabs.forEach(tab => {
      const d = getDomain(tab.url);
      if (!map[d]) map[d] = { domain: d, visits: 0, count: 0, memory: 0, url: tab.url };
      map[d].visits += tab.visits;
      map[d].count += 1;
      map[d].memory += tab.memory;
    });
    return Object.values(map).sort((a, b) => b.visits - a.visits).slice(0, 6);
  }, [rankedTabs]);

  const maxDomainVisits = domainHeat[0]?.visits || 1;

  return (
    <div className="p-3 space-y-5" data-testid="heatmap-panel">
      <div className="flex items-center gap-2">
        <Flame size={14} className="text-orange-400" strokeWidth={2} />
        <span className="text-xs font-heading font-bold">Activity Heatmap</span>
      </div>

      {/* Domain heatmap */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <TrendingUp size={11} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Top Domains
          </span>
        </div>
        <div className="space-y-1.5">
          {domainHeat.map(({ domain, visits, count, memory, url }) => {
            const ratio = visits / maxDomainVisits;
            const heat = getHeatColor(ratio);
            return (
              <div key={domain} className="group" data-testid={`heatmap-domain-${domain}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <img
                    src={getFaviconUrl(url)}
                    alt=""
                    className="w-3.5 h-3.5 rounded-[2px]"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="text-[11px] font-body truncate flex-1">{domain}</span>
                  <span className={`text-[9px] font-mono ${heat.text}`}>{visits}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/40">{count} tab{count > 1 ? 's' : ''}</span>
                </div>
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${heat.bar} transition-all duration-500`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab ranking */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Flame size={11} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Most Visited Tabs
          </span>
        </div>
        <div className="space-y-0.5">
          {rankedTabs.slice(0, 8).map((tab, idx) => {
            const ratio = tab.visits / maxVisits;
            const heat = getHeatColor(ratio);
            return (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
                  hover:bg-white/[0.04] transition-colors group"
                onClick={() => onSwitch(tab.id)}
                data-testid={`heatmap-tab-${tab.id}`}
              >
                <span className={`text-[9px] font-mono w-4 text-right ${idx < 3 ? heat.text : 'text-muted-foreground/40'}`}>
                  {idx + 1}
                </span>
                <img
                  src={getFaviconUrl(tab.url)}
                  alt=""
                  className="w-3.5 h-3.5 rounded-[2px] shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-body truncate">{tab.title}</div>
                  <div className="flex items-center gap-2 mt-px">
                    <div className="flex-1 h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${heat.bar} transition-all duration-500`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <span className={`text-[8px] font-mono shrink-0 ${heat.text}`}>
                      {tab.visits}
                    </span>
                  </div>
                </div>
                <span className="text-[8px] font-mono text-muted-foreground/30 shrink-0">
                  {tab.memory}MB
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested session template */}
      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={11} className="text-primary" strokeWidth={2} />
          <span className="text-[10px] font-heading font-bold text-primary">Suggested Workflow</span>
        </div>
        <p className="text-[10px] text-muted-foreground/70 font-body mb-2 leading-relaxed">
          Based on your activity, here's a recommended session template:
        </p>
        <div className="space-y-1 mb-2.5">
          {suggestedTabs.map(tab => (
            <div key={tab.id} className="flex items-center gap-1.5 text-[10px] text-foreground/70">
              <img
                src={getFaviconUrl(tab.url)}
                alt=""
                className="w-3 h-3 rounded-[2px]"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="truncate">{tab.title}</span>
            </div>
          ))}
        </div>
        <button
          data-testid="save-suggested-session-btn"
          onClick={() => toast.success('Workflow session saved!')}
          className="w-full h-7 text-[10px] font-heading font-semibold rounded-md
            bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          Save as Session Template
        </button>
      </div>
    </div>
  );
}
