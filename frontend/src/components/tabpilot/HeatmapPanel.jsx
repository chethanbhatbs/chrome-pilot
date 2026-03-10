import { useState, useMemo } from 'react';
import { Flame, TrendingUp, BarChart3, Clock, Zap, ChevronDown, ChevronUp, Filter, Check } from 'lucide-react';
import { getDomain, getFaviconUrl, handleFaviconError as sharedFaviconError } from '@/utils/grouping';
import { useHistoryData } from '@/hooks/useHistoryData';
import { isExtensionContext } from '@/utils/chromeAdapter';

function getHeatColor(ratio) {
  if (ratio > 0.8) return { bar: 'hsl(var(--destructive))', text: 'text-destructive' };
  if (ratio > 0.6) return { bar: 'hsl(var(--chart-3))', text: 'text-orange-400' };
  if (ratio > 0.4) return { bar: 'hsl(var(--chart-3))', text: 'text-amber-400' };
  if (ratio > 0.2) return { bar: 'hsl(var(--primary))', text: 'text-primary' };
  return { bar: 'hsl(var(--muted-foreground))', text: 'text-muted-foreground' };
}

function BarChart({ data, maxVal, labelKey, valueKey, unitLabel }) {
  const barH = 18;
  const gap = 5;
  const labelW = 90;
  const chartW = 280;
  const barAreaW = chartW - labelW - 50;
  const svgH = data.length * (barH + gap) + 4;

  return (
    <svg viewBox={`0 0 ${chartW} ${svgH}`} className="w-full" data-testid="bar-chart">
      {data.map((item, i) => {
        const y = i * (barH + gap) + 2;
        const ratio = item[valueKey] / maxVal;
        const heat = getHeatColor(ratio);
        const barW = Math.max(2, ratio * barAreaW);
        return (
          <g key={item[labelKey]} className="chart-bar-animate">
            <text x={labelW - 4} y={y + 13} textAnchor="end"
              className="fill-muted-foreground" style={{ fontSize: '9px', fontFamily: 'inherit' }}>
              {item[labelKey].length > 14 ? item[labelKey].slice(0, 14) + '..' : item[labelKey]}
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
  const h = 85;
  const padTop = 10;
  const padBot = 20;
  const padLeft = 28;
  const padRight = 8;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBot;

  // Trim trailing zero entries (future hours/days with no data)
  let visibleData = [...data];
  while (visibleData.length > 1 && visibleData[visibleData.length - 1][yKey] === 0) {
    visibleData.pop();
  }

  const maxVal = Math.max(...data.map(d => d[yKey]), 1);
  const points = visibleData.map((d, i) => ({
    x: padLeft + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padTop + chartH - (d[yKey] / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? linePath + ` L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`
    : '';

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
      <path d={areaPath} fill="url(#areaGrad)" className="chart-area-animate" />
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={linePath} fill="none" className="stroke-primary chart-line-animate" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        style={{ '--line-length': 1000 }} />
      {/* X-axis labels for ALL data points (including future) */}
      {data.map((d, i) => {
        const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
        return (
          <text key={`label-${i}`} x={x} y={h - 3} textAnchor="middle"
            className="fill-muted-foreground" style={{ fontSize: '7px', fontFamily: 'inherit' }}>
            {d[xKey]}
          </text>
        );
      })}
      {/* Data dots and values only for visible (non-future) data */}
      {points.map((p, i) => {
        const val = visibleData[i][yKey];
        const label = typeof val === 'number' && yKey === 'hours' ? val.toFixed(1) : val;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={2} className="fill-primary" />
            <text x={p.x} y={p.y - 5} textAnchor="middle"
              className="fill-foreground" style={{ fontSize: '7px', fontWeight: 600, fontFamily: 'inherit' }}>
              {label}{yLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const TIME_FILTERS = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

export function HeatmapPanel({ allTabs, onSwitch, selectMode, selectedTabIds, onToggleSelect }) {
  const [timeFilter, setTimeFilter] = useState('week');
  const isExt = isExtensionContext();

  // Real Chrome history data (null in web preview)
  const historyData = useHistoryData(timeFilter);

  // No data available — show placeholder
  if (!isExt && !historyData) {
    return (
      <div className="p-3 space-y-3" data-testid="heatmap-panel">
        <div className="flex items-center gap-2">
          <Flame size={13} className="text-orange-400" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Activity Heatmap</span>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Flame size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-[11px]">Activity data is available when running as a Chrome extension.</p>
        </div>
      </div>
    );
  }

  // Waiting for data to load
  if (!historyData) {
    return (
      <div className="p-3 space-y-3" data-testid="heatmap-panel">
        <div className="flex items-center gap-2">
          <Flame size={13} className="text-orange-400" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Activity Heatmap</span>
        </div>
        <div className="text-center py-6 text-muted-foreground text-[11px]">Loading history...</div>
      </div>
    );
  }

  return <HeatmapContent
    historyData={historyData}
    allTabs={allTabs}
    onSwitch={onSwitch}
    timeFilter={timeFilter}
    setTimeFilter={setTimeFilter}
    selectMode={selectMode}
    selectedTabIds={selectedTabIds}
    onToggleSelect={onToggleSelect}
  />;
}

const SITE_NAMES = {
  'mail.google.com': 'Gmail', 'drive.google.com': 'Google Drive',
  'docs.google.com': 'Google Docs', 'sheets.google.com': 'Google Sheets',
  'calendar.google.com': 'Google Calendar', 'meet.google.com': 'Google Meet',
  'youtube.com': 'YouTube', 'github.com': 'GitHub', 'gitlab.com': 'GitLab',
  'stackoverflow.com': 'Stack Overflow', 'reddit.com': 'Reddit',
  'twitter.com': 'Twitter', 'x.com': 'X', 'linkedin.com': 'LinkedIn',
  'slack.com': 'Slack', 'notion.so': 'Notion', 'figma.com': 'Figma',
  'vercel.com': 'Vercel', 'netlify.com': 'Netlify', 'aws.amazon.com': 'AWS',
  'console.cloud.google.com': 'Google Cloud', 'portal.azure.com': 'Azure',
  'chat.openai.com': 'ChatGPT', 'claude.ai': 'Claude',
};
function getSiteName(url) {
  const domain = getDomain(url);
  if (SITE_NAMES[domain]) return SITE_NAMES[domain];
  // Try without www
  const bare = domain.replace(/^www\./, '');
  if (SITE_NAMES[bare]) return SITE_NAMES[bare];
  // Capitalize first part of domain: "emergent.sh" → "Emergent"
  const parts = bare.split('.');
  const name = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function HeatmapContent({ historyData, allTabs, onSwitch, timeFilter, setTimeFilter, selectMode, selectedTabIds, onToggleSelect }) {
  const [showAllVisited, setShowAllVisited] = useState(false);
  const [metricMode, setMetricMode] = useState('duration');
  const [showMetricMenu, setShowMetricMenu] = useState(false);
  const domainTimeData = historyData.topDomains;

  const totalHours = (historyData.totalMinutes / 60).toFixed(1);

  const timelineConfig = useMemo(() => {
    if (metricMode === 'visits') {
      switch (timeFilter) {
        case 'day':  return { data: historyData.timelineData, xKey: 'hour', yKey: 'visits', yLabel: '', title: 'Today (visits per 3h)' };
        case 'week': return { data: historyData.timelineData, xKey: 'day',  yKey: 'visits', yLabel: '', title: 'This Week (visits/day)' };
        default:     return { data: historyData.timelineData, xKey: 'week', yKey: 'visits', yLabel: '', title: 'This Month (visits/week)' };
      }
    } else {
      switch (timeFilter) {
        case 'day':  return { data: historyData.timelineData, xKey: 'hour', yKey: 'minutes', yLabel: 'm', title: 'Today (est. minutes per 3h)' };
        case 'week': return { data: historyData.timelineData, xKey: 'day',  yKey: 'hours',   yLabel: 'h', title: 'This Week (est. hours/day)' };
        default:     return { data: historyData.timelineData, xKey: 'week', yKey: 'hours',   yLabel: 'h', title: 'This Month (est. hours/week)' };
      }
    }
  }, [historyData, timeFilter, metricMode]);

  // Domain chart: use hours for week/month, minutes for day
  const domainValueKey = metricMode === 'visits' ? 'visits' : (timeFilter === 'day' ? 'minutes' : 'hours');
  const domainUnitLabel = metricMode === 'visits' ? '' : (timeFilter === 'day' ? 'm' : 'h');
  const maxDomainVal = domainTimeData[0]?.[domainValueKey] || 1;

  // Rank open tabs by domain visit count (aggregate all paths under same domain)
  const rankedTabs = useMemo(() => {
    const urlCounts = historyData.urlVisitCounts || {};
    // Aggregate all history visits by domain
    const domainVisits = {};
    Object.entries(urlCounts).forEach(([url, count]) => {
      const d = getDomain(url);
      if (d) domainVisits[d] = (domainVisits[d] || 0) + count;
    });
    // Deduplicate open tabs by domain — keep first per domain, sum visits
    const seenDomains = new Set();
    return allTabs
      .map(tab => {
        const domain = getDomain(tab.url);
        const visits = domainVisits[domain] || 0;
        return { ...tab, visits, domain };
      })
      .filter(tab => {
        if (tab.visits === 0) return false;
        if (seenDomains.has(tab.domain)) return false;
        seenDomains.add(tab.domain);
        return true;
      })
      .sort((a, b) => b.visits - a.visits);
  }, [allTabs, historyData]);

  const maxVisits = rankedTabs[0]?.visits || 1;

  return (
    <div className="p-3 space-y-3.5" data-testid="heatmap-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={13} className="text-orange-400" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Activity Heatmap</span>
          <span className="text-[8px] font-mono text-primary/60 bg-primary/10 px-1 py-0.5 rounded">LIVE</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span className="text-primary font-semibold">{totalHours}h</span>
          <span className="text-muted-foreground/50">|</span>
          <span className="text-muted-foreground">{historyData.totalVisits} visits</span>
        </div>
      </div>

      {/* Time filter + metric funnel */}
      <div className="flex items-center gap-1.5" data-testid="heatmap-time-filters">
        <div className="flex gap-1 flex-1">
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              data-testid={`heatmap-filter-${f.id}`}
              onClick={() => setTimeFilter(f.id)}
              className={`cursor-pointer flex-1 py-1 rounded-md text-[10px] font-body font-medium transition-all duration-150
                ${timeFilter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Metric funnel toggle */}
        <div className="relative">
          <button
            onClick={() => setShowMetricMenu(prev => !prev)}
            className={`cursor-pointer flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-heading font-semibold transition-all duration-150
              ${showMetricMenu ? 'bg-primary/15 text-primary' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
            data-testid="heatmap-metric-toggle"
          >
            <Filter size={10} strokeWidth={2} />
            {metricMode === 'duration' ? 'Hours' : 'Visits'}
          </button>
          {showMetricMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMetricMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[100px]">
                <button
                  onClick={() => { setMetricMode('duration'); setShowMetricMenu(false); }}
                  className={`cursor-pointer w-full text-left px-3 py-1.5 text-[10px] font-body transition-colors
                    ${metricMode === 'duration' ? 'text-primary font-semibold bg-primary/10' : 'text-foreground/70 hover:bg-[hsl(var(--hover-subtle))]'}`}
                >
                  Duration (hours)
                </button>
                <button
                  onClick={() => { setMetricMode('visits'); setShowMetricMenu(false); }}
                  className={`cursor-pointer w-full text-left px-3 py-1.5 text-[10px] font-body transition-colors
                    ${metricMode === 'visits' ? 'text-primary font-semibold bg-primary/10' : 'text-foreground/70 hover:bg-[hsl(var(--hover-subtle))]'}`}
                >
                  Page visits
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Timeline Chart */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Clock size={9} className="text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-[9px] font-heading text-muted-foreground/70 uppercase tracking-wider">{timelineConfig.title}</span>
        </div>
        <div className="bg-card rounded-lg border border-border/50 p-2">
          <TimelineChart data={timelineConfig.data} xKey={timelineConfig.xKey} yKey={timelineConfig.yKey} yLabel={timelineConfig.yLabel} />
        </div>
      </div>

      {/* Time by Domain */}
      {domainTimeData.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <BarChart3 size={9} className="text-muted-foreground/60" strokeWidth={1.5} />
            <span className="text-[9px] font-heading text-muted-foreground/70 uppercase tracking-wider">Top Domains</span>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-2">
            <BarChart data={domainTimeData} maxVal={maxDomainVal} labelKey="domain" valueKey={domainValueKey} unitLabel={domainUnitLabel} />
          </div>
        </div>
      )}

      {/* Most Visited Open Tabs (real data) */}
      {rankedTabs.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={9} className="text-muted-foreground/60" strokeWidth={1.5} />
            <span className="text-[9px] font-heading text-muted-foreground/70 uppercase tracking-wider">Most Visited (open tabs)</span>
          </div>
          <div className="space-y-0.5">
            {rankedTabs.slice(0, showAllVisited ? rankedTabs.length : 5).map((tab, idx) => {
              const ratio = tab.visits / maxVisits;
              const heat = getHeatColor(ratio);
              const siteName = getSiteName(tab.url);
              const isSelected = selectedTabIds?.has(tab.id);
              return (
                <div
                  key={tab.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[hsl(var(--hover-subtle))] transition-colors duration-150"
                  onClick={() => selectMode ? onToggleSelect?.(tab.id) : onSwitch(tab.id)}
                  data-testid={`heatmap-tab-${tab.id}`}
                >
                  {selectMode ? (
                    <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-all duration-150
                      ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {isSelected && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
                    </div>
                  ) : (
                    <span className={`text-[9px] font-mono w-3 text-right ${heat.text}`}>{idx + 1}</span>
                  )}
                  <img src={getFaviconUrl(tab.url, tab.favIconUrl)} alt="" className="w-3.5 h-3.5 rounded-[2px] shrink-0 bg-secondary/50" data-tab-url={tab.url} data-chrome-favicon={tab.favIconUrl || ''} onError={sharedFaviconError} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-body font-medium truncate">{siteName}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: heat.bar }} />
                      </div>
                      <span className={`text-[8px] font-mono ${heat.text}`}>{tab.visits} visits</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {rankedTabs.length > 5 && (
            <button
              onClick={() => setShowAllVisited(prev => !prev)}
              className="cursor-pointer flex items-center justify-center gap-1 w-full py-1 mt-1 text-[9px] font-heading text-primary/70 hover:text-primary transition-colors"
            >
              {showAllVisited ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {showAllVisited ? 'Show less' : `Show ${rankedTabs.length - 5} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
