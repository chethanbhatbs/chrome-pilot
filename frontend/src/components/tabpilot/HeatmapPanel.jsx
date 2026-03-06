import { Flame, TrendingUp, BarChart3, Clock, Zap } from 'lucide-react';
import { getDomain, getFaviconUrl } from '@/utils/grouping';
import { TAB_METRICS, ACTIVITY_TIMELINE } from '@/utils/mockData';
import { useMemo } from 'react';
import { toast } from 'sonner';

function getHeatColor(ratio) {
  if (ratio > 0.8) return { bar: '#ef4444', text: 'text-red-400', label: 'Very High' };
  if (ratio > 0.6) return { bar: '#f97316', text: 'text-orange-400', label: 'High' };
  if (ratio > 0.4) return { bar: '#eab308', text: 'text-amber-400', label: 'Medium' };
  if (ratio > 0.2) return { bar: '#3b82f6', text: 'text-blue-400', label: 'Low' };
  return { bar: '#64748b', text: 'text-slate-400', label: 'Minimal' };
}

function BarChart({ data, maxVal, labelKey, valueKey, unitLabel }) {
  const barH = 18;
  const gap = 6;
  const labelW = 100;
  const chartW = 280;
  const barAreaW = chartW - labelW - 50;
  const svgH = data.length * (barH + gap) + 20;

  return (
    <svg viewBox={`0 0 ${chartW} ${svgH}`} className="w-full" data-testid="bar-chart">
      {data.map((item, i) => {
        const y = i * (barH + gap) + 4;
        const ratio = item[valueKey] / maxVal;
        const heat = getHeatColor(ratio);
        const barW = Math.max(2, ratio * barAreaW);
        return (
          <g key={item[labelKey]}>
            <text x={labelW - 4} y={y + 13} textAnchor="end"
              className="fill-muted-foreground" style={{ fontSize: '9px', fontFamily: 'inherit' }}>
              {item[labelKey].length > 16 ? item[labelKey].slice(0, 16) + '...' : item[labelKey]}
            </text>
            <rect x={labelW} y={y} width={barAreaW} height={barH} rx={3}
              className="fill-muted/30" />
            <rect x={labelW} y={y} width={barW} height={barH} rx={3}
              fill={heat.bar} opacity={0.85} />
            <text x={labelW + barW + 4} y={y + 13}
              className="fill-foreground" style={{ fontSize: '9px', fontWeight: 600, fontFamily: 'inherit' }}>
              {item[valueKey]} {unitLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data }) {
  const w = 280;
  const h = 90;
  const padTop = 10;
  const padBot = 22;
  const padLeft = 28;
  const padRight = 8;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBot;

  const maxVisits = Math.max(...data.map(d => d.visits));
  const points = data.map((d, i) => ({
    x: padLeft + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - (d.visits / maxVisits) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" data-testid="line-chart">
      {/* Grid lines */}
      {[0, 0.5, 1].map(r => {
        const y = padTop + chartH - r * chartH;
        return (
          <g key={r}>
            <line x1={padLeft} y1={y} x2={w - padRight} y2={y}
              className="stroke-border" strokeWidth={0.5} strokeDasharray={r === 0 ? '' : '2 2'} />
            <text x={padLeft - 4} y={y + 3} textAnchor="end"
              className="fill-muted-foreground" style={{ fontSize: '7px', fontFamily: 'inherit' }}>
              {Math.round(maxVisits * r)}
            </text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Line */}
      <path d={linePath} fill="none" className="stroke-primary" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.5} className="fill-primary" />
          <text x={p.x} y={h - 4} textAnchor="middle"
            className="fill-muted-foreground" style={{ fontSize: '7px', fontFamily: 'inherit' }}>
            {data[i].day}
          </text>
          <text x={p.x} y={p.y - 6} textAnchor="middle"
            className="fill-foreground" style={{ fontSize: '7px', fontWeight: 600, fontFamily: 'inherit' }}>
            {data[i].visits}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HeatmapPanel({ allTabs, visitCounts, onSwitch }) {
  const rankedTabs = useMemo(() => {
    return allTabs.map(tab => ({
      ...tab,
      visits: (visitCounts[tab.id] || 0) + (TAB_METRICS[tab.id]?.visitCount || 0),
      memory: TAB_METRICS[tab.id]?.memory || 80,
    })).sort((a, b) => b.visits - a.visits);
  }, [allTabs, visitCounts]);

  const maxVisits = rankedTabs[0]?.visits || 1;
  const totalVisits = rankedTabs.reduce((s, t) => s + t.visits, 0);

  const domainData = useMemo(() => {
    const map = {};
    rankedTabs.forEach(tab => {
      const d = getDomain(tab.url);
      if (!map[d]) map[d] = { domain: d, visits: 0, tabs: 0, memory: 0, url: tab.url };
      map[d].visits += tab.visits;
      map[d].tabs += 1;
      map[d].memory += tab.memory;
    });
    return Object.values(map).sort((a, b) => b.visits - a.visits).slice(0, 6);
  }, [rankedTabs]);

  const maxDomainVisits = domainData[0]?.visits || 1;

  return (
    <div className="p-3 space-y-5" data-testid="heatmap-panel">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Flame size={14} className="text-orange-400" strokeWidth={2} />
          <span className="text-sm font-heading font-bold">Activity Heatmap</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Tracks how often you visit each tab. Higher visit counts mean heavier usage.
          Total: <span className="font-semibold text-foreground">{totalVisits} visits</span> across {rankedTabs.length} tabs.
        </p>
      </div>

      {/* Activity Timeline - Line Chart */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock size={10} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Weekly Activity (visits per day)
          </span>
        </div>
        <div className="bg-card rounded-lg border border-border p-2">
          <LineChart data={ACTIVITY_TIMELINE} />
        </div>
      </div>

      {/* Domain Bar Chart */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 size={10} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Visits by Domain
          </span>
        </div>
        <div className="bg-card rounded-lg border border-border p-2">
          <BarChart
            data={domainData}
            maxVal={maxDomainVisits}
            labelKey="domain"
            valueKey="visits"
            unitLabel="visits"
          />
        </div>
      </div>

      {/* Top Tabs Ranking */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={10} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Most Visited Tabs
          </span>
        </div>
        <div className="space-y-0.5">
          {rankedTabs.slice(0, 6).map((tab, idx) => {
            const ratio = tab.visits / maxVisits;
            const heat = getHeatColor(ratio);
            return (
              <div
                key={tab.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer
                  hover:bg-muted/50 transition-colors"
                onClick={() => onSwitch(tab.id)}
                data-testid={`heatmap-tab-${tab.id}`}
              >
                <span className={`text-[10px] font-mono w-3 text-right ${heat.text}`}>
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${ratio * 100}%`, backgroundColor: heat.bar }}
                      />
                    </div>
                    <span className={`text-[8px] font-mono ${heat.text}`}>
                      {tab.visits} visits
                    </span>
                    <span className="text-[8px] font-mono text-muted-foreground">
                      {tab.memory}MB
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Workflow */}
      <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap size={11} className="text-primary" strokeWidth={2} />
          <span className="text-[11px] font-heading font-bold text-primary">Suggested Workflow</span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2.5 leading-relaxed">
          Based on your most-visited tabs, here's a curated session template:
        </p>
        <div className="space-y-1 mb-3">
          {rankedTabs.slice(0, 5).map(tab => (
            <div key={tab.id} className="flex items-center gap-2 text-[10px]">
              <img
                src={getFaviconUrl(tab.url)}
                alt=""
                className="w-3 h-3 rounded-[2px]"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="truncate text-foreground/80">{tab.title}</span>
              <span className="text-muted-foreground ml-auto shrink-0">{tab.visits}</span>
            </div>
          ))}
        </div>
        <button
          data-testid="save-suggested-session-btn"
          onClick={() => toast.success('Workflow session saved!')}
          className="w-full h-7 text-[10px] font-heading font-semibold rounded-md
            bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Save as Session Template
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 pt-1">
        {[
          { color: '#64748b', label: 'Low' },
          { color: '#3b82f6', label: 'Medium' },
          { color: '#eab308', label: 'High' },
          { color: '#f97316', label: 'Very High' },
          { color: '#ef4444', label: 'Critical' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[8px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
