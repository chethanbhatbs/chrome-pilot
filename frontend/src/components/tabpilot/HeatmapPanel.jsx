import { useState, useMemo } from 'react';
import { Flame, TrendingUp, BarChart3, Clock, Zap, Calendar, Filter } from 'lucide-react';
import { getDomain, getFaviconUrl } from '@/utils/grouping';
import {
  TAB_METRICS, DOMAIN_TIME_SPENT, TAB_TIME_MINUTES,
  HOURLY_ACTIVITY, WEEKLY_ACTIVITY, MONTHLY_ACTIVITY,
} from '@/utils/mockData';
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
  const svgH = data.length * (barH + gap) + 8;

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
              {item[valueKey]}{unitLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TimelineChart({ data, xKey, yKey, yLabel }) {
  const w = 280;
  const h = 90;
  const padTop = 10;
  const padBot = 22;
  const padLeft = 28;
  const padRight = 8;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBot;

  const maxVal = Math.max(...data.map(d => d[yKey]));
  const points = data.map((d, i) => ({
    x: padLeft + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padTop + chartH - (d[yKey] / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" data-testid="timeline-chart">
      {[0, 0.5, 1].map(r => {
        const y = padTop + chartH - r * chartH;
        return (
          <g key={r}>
            <line x1={padLeft} y1={y} x2={w - padRight} y2={y}
              className="stroke-border" strokeWidth={0.5} strokeDasharray={r === 0 ? '' : '2 2'} />
            <text x={padLeft - 4} y={y + 3} textAnchor="end"
              className="fill-muted-foreground" style={{ fontSize: '7px', fontFamily: 'inherit' }}>
              {(maxVal * r).toFixed(yKey === 'hours' ? 1 : 0)}{yLabel}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={linePath} fill="none" className="stroke-primary" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.5} className="fill-primary" />
          <text x={p.x} y={h - 4} textAnchor="middle"
            className="fill-muted-foreground" style={{ fontSize: '7px', fontFamily: 'inherit' }}>
            {data[i][xKey]}
          </text>
          <text x={p.x} y={p.y - 6} textAnchor="middle"
            className="fill-foreground" style={{ fontSize: '7px', fontWeight: 600, fontFamily: 'inherit' }}>
            {typeof data[i][yKey] === 'number' && yKey === 'hours' ? data[i][yKey].toFixed(1) : data[i][yKey]}
          </text>
        </g>
      ))}
    </svg>
  );
}

const TIME_FILTERS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'custom', label: 'Custom' },
];

export function HeatmapPanel({ allTabs, visitCounts, onSwitch }) {
  const [timeFilter, setTimeFilter] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Domain time data
  const domainTimeData = useMemo(() => {
    return Object.entries(DOMAIN_TIME_SPENT)
      .map(([domain, data]) => ({
        domain: data.label,
        hours: data.hours,
        color: data.color,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);
  }, []);

  const maxDomainHours = domainTimeData[0]?.hours || 1;

  // Timeline data based on filter
  const timelineConfig = useMemo(() => {
    switch (timeFilter) {
      case 'day':
        return { data: HOURLY_ACTIVITY, xKey: 'hour', yKey: 'minutes', yLabel: 'm', title: 'Today (active minutes per hour)' };
      case 'week':
        return { data: WEEKLY_ACTIVITY, xKey: 'day', yKey: 'hours', yLabel: 'h', title: 'This Week (hours per day)' };
      case 'month':
        return { data: MONTHLY_ACTIVITY, xKey: 'week', yKey: 'hours', yLabel: 'h', title: 'This Month (hours per week)' };
      case 'custom':
        return { data: WEEKLY_ACTIVITY, xKey: 'day', yKey: 'hours', yLabel: 'h', title: 'Custom Range (hours per day)' };
      default:
        return { data: WEEKLY_ACTIVITY, xKey: 'day', yKey: 'hours', yLabel: 'h', title: 'This Week' };
    }
  }, [timeFilter]);

  // Tab time spent ranking
  const rankedTabs = useMemo(() => {
    return allTabs.map(tab => ({
      ...tab,
      timeMinutes: TAB_TIME_MINUTES[tab.id] || 5,
      visits: (visitCounts[tab.id] || 0) + (TAB_METRICS[tab.id]?.visitCount || 0),
      memory: TAB_METRICS[tab.id]?.memory || 80,
    })).sort((a, b) => b.timeMinutes - a.timeMinutes);
  }, [allTabs, visitCounts]);

  const maxTime = rankedTabs[0]?.timeMinutes || 1;
  const totalHours = (rankedTabs.reduce((s, t) => s + t.timeMinutes, 0) / 60).toFixed(1);

  return (
    <div className="p-3 space-y-4" data-testid="heatmap-panel">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Flame size={14} className="text-orange-400" strokeWidth={2} />
          <span className="text-sm font-heading font-bold">Activity Heatmap</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Tracks time you spend on each site in hours.
          Total: <span className="font-semibold text-foreground">{totalHours}h</span> across {rankedTabs.length} tabs.
        </p>
      </div>

      {/* Time filter pills */}
      <div data-testid="heatmap-time-filters">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter size={10} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Time Range
          </span>
        </div>
        <div className="flex gap-1">
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              data-testid={`heatmap-filter-${f.id}`}
              onClick={() => setTimeFilter(f.id)}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-body font-medium transition-all duration-150
                ${timeFilter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {timeFilter === 'custom' && (
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground block mb-0.5">From</label>
              <input
                data-testid="heatmap-custom-from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full h-7 px-2 text-[10px] font-body bg-card border border-border rounded-md
                  text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground block mb-0.5">To</label>
              <input
                data-testid="heatmap-custom-to"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full h-7 px-2 text-[10px] font-body bg-card border border-border rounded-md
                  text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Activity Timeline Chart */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock size={10} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            {timelineConfig.title}
          </span>
        </div>
        <div className="bg-card rounded-lg border border-border p-2">
          <TimelineChart
            data={timelineConfig.data}
            xKey={timelineConfig.xKey}
            yKey={timelineConfig.yKey}
            yLabel={timelineConfig.yLabel}
          />
        </div>
      </div>

      {/* Time Spent by Domain — Horizontal bar chart */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 size={10} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Time by App (hours)
          </span>
        </div>
        <div className="bg-card rounded-lg border border-border p-2">
          <BarChart
            data={domainTimeData}
            maxVal={maxDomainHours}
            labelKey="domain"
            valueKey="hours"
            unitLabel="h"
          />
        </div>
      </div>

      {/* Top Tabs by Time */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={10} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Most Used Tabs (by time)
          </span>
        </div>
        <div className="space-y-0.5">
          {rankedTabs.slice(0, 6).map((tab, idx) => {
            const ratio = tab.timeMinutes / maxTime;
            const heat = getHeatColor(ratio);
            const hrs = Math.floor(tab.timeMinutes / 60);
            const mins = tab.timeMinutes % 60;
            const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
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
                      {timeStr}
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
          Based on your most-used tabs, here's a curated session template:
        </p>
        <div className="space-y-1 mb-3">
          {rankedTabs.slice(0, 5).map(tab => {
            const hrs = Math.floor(tab.timeMinutes / 60);
            const mins = tab.timeMinutes % 60;
            const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
            return (
              <div key={tab.id} className="flex items-center gap-2 text-[10px]">
                <img
                  src={getFaviconUrl(tab.url)}
                  alt=""
                  className="w-3 h-3 rounded-[2px]"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="truncate text-foreground/80">{tab.title}</span>
                <span className="text-muted-foreground ml-auto shrink-0">{timeStr}</span>
              </div>
            );
          })}
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
