import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useTimelineGrid } from '@/hooks/useHistoryData';
import { isExtensionContext } from '@/utils/chromeAdapter';

function getActivityColor(ratio) {
  if (ratio <= 0) return 'bg-white/[0.02]';
  if (ratio < 0.2) return 'bg-primary/10';
  if (ratio < 0.4) return 'bg-primary/25';
  if (ratio < 0.6) return 'bg-primary/45';
  if (ratio < 0.8) return 'bg-primary/65';
  return 'bg-primary/90';
}

export function TabTimeline() {
  const [selectedCell, setSelectedCell] = useState(null);
  const timelineData = useTimelineGrid();
  const currentCellRef = useRef(null);

  const now = new Date();
  const currentHour = now.getHours();
  const todayRowIdx = 6; // grid is ordered: 6 days ago (0) → today (6)
  const currentColIdx = currentHour; // 0-23, matches grid column index

  useEffect(() => {
    if (currentCellRef.current) {
      currentCellRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [timelineData]);

  if (!isExtensionContext()) {
    return (
      <div className="p-3 space-y-3" data-testid="tab-timeline-panel">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-primary" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Tab Timeline</span>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Calendar size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-[11px]">Timeline data is available when running as a Chrome extension.</p>
        </div>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="p-3 space-y-3" data-testid="tab-timeline-panel">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-primary" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Tab Timeline</span>
        </div>
        <div className="text-center py-6 text-muted-foreground text-[11px]">Loading history...</div>
      </div>
    );
  }

  const { grid, totalHours, mostActiveDay } = timelineData;

  const hourLabels = [];
  for (let h = 0; h <= 23; h++) {
    if (h === 0) hourLabels.push('12a');
    else if (h < 12) hourLabels.push(`${h}a`);
    else if (h === 12) hourLabels.push('12p');
    else hourLabels.push(`${h - 12}p`);
  }

  return (
    <div className="p-3 space-y-3" data-testid="tab-timeline-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-primary" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Tab Timeline</span>
          <span className="text-[8px] font-mono text-primary/60 bg-primary/10 px-1 py-0.5 rounded">LIVE</span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">{totalHours}h this week</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Your browsing activity over the past 7 days. Each cell is one hour.
        {mostActiveDay.day && (
          <> Most active: <span className="text-foreground font-semibold">{mostActiveDay.day}</span> ({mostActiveDay.hours}h).</>
        )}
      </p>

      {/* Contributions-style grid */}
      <div className="bg-card rounded-lg border border-border/50 p-4 pr-5 overflow-x-auto">
        {/* Hour labels — 12a to 12a (midnight to midnight) */}
        <div className="flex items-center gap-0 mb-1">
          <div className="w-8 shrink-0" />
          {hourLabels.map((label, i) => (
            <div key={i} className="flex-1 min-w-[14px] text-center text-[6px] text-muted-foreground/60 font-mono">
              {i % 4 === 0 ? label : ''}
            </div>
          ))}
          <div className="w-3 shrink-0 text-[6px] text-muted-foreground/60 font-mono text-left">12a</div>
        </div>

        {/* Day rows */}
        {grid.map((day, di) => (
          <div key={di} className="flex items-center gap-0 mb-[2px]">
            <div className="w-8 shrink-0 text-[8px] text-muted-foreground/70 font-mono pr-1 text-right">
              {day.dayName}
            </div>
            {day.hours.map((hour, hi) => {
              const isCurrentTime = di === todayRowIdx && hi === currentColIdx;
              return (
                <div
                  key={hi}
                  ref={isCurrentTime ? currentCellRef : undefined}
                  className={`flex-1 min-w-[14px] h-[14px] rounded-[2px] mx-[0.5px] cursor-pointer relative
                    ${isCurrentTime ? 'bg-primary/40' : getActivityColor(hour.activity)}
                    ${selectedCell?.day === di && selectedCell?.hour === hi ? 'ring-1 ring-primary' : ''}
                    hover:ring-1 hover:ring-foreground/30 transition-all duration-100`}
                  onClick={() => setSelectedCell(selectedCell?.day === di && selectedCell?.hour === hi ? null : { day: di, hour: hi })}
                  data-testid={`timeline-cell-${di}-${hi}`}
                >
                  {isCurrentTime && (
                    <div className="absolute inset-0 rounded-[3px] border-2 border-primary animate-[pulse_3s_ease-in-out_infinite]" />
                  )}
                </div>
              );
            })}
            <div className="w-3 shrink-0" />
          </div>
        ))}

        {/* Now indicator */}
        <div className="flex items-center gap-0 mt-1">
          <div className="w-8 shrink-0" />
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 min-w-[14px] text-center">
              {i === currentColIdx && (
                <span className="text-[7px] font-mono font-bold text-primary animate-[pulse_3s_ease-in-out_infinite]">NOW</span>
              )}
            </div>
          ))}
          <div className="w-3 shrink-0" />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-border/30">
          <span className="text-[8px] text-muted-foreground/60 font-mono">Less</span>
          <div className="flex items-center gap-[2px]">
            {[0, 0.15, 0.35, 0.55, 0.75, 0.95].map((v, i) => (
              <div key={i} className={`w-3 h-3 rounded-[2px] ${getActivityColor(v)}`} />
            ))}
          </div>
          <span className="text-[8px] text-muted-foreground/60 font-mono">More</span>
        </div>
      </div>

      {/* Selected cell detail */}
      {selectedCell && (() => {
        const day = grid[selectedCell.day];
        if (!day) return null;
        const hour = day.hours[selectedCell.hour];
        if (!hour) return null;
        const h = hour.hour;
        const timeLabel = h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
        return (
          <div className="bg-card rounded-lg border border-border/50 p-2.5 animate-slide-in" data-testid="timeline-detail">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock size={10} className="text-primary" strokeWidth={2} />
              <span className="text-[11px] font-heading font-semibold">
                {day.dayName}, {day.dateStr} &middot; {timeLabel}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[10px] text-muted-foreground">
                Active: <span className="text-foreground font-semibold">{hour.minutesActive}m</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Intensity: <span className="text-foreground font-semibold">{Math.round(hour.activity * 100)}%</span>
              </div>
            </div>
            {hour.domains.length > 0 && (
              <div>
                <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wider">Active sites</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hour.domains.map(d => (
                    <span key={d} className="text-[9px] font-body px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Daily breakdown */}
      <div>
        <span className="text-[9px] font-heading text-muted-foreground uppercase tracking-wider font-semibold">Daily Breakdown</span>
        <div className="space-y-1 mt-1.5">
          {grid.map((day, i) => {
            const totalMin = day.hours.reduce((s, h) => s + h.minutesActive, 0);
            const totalHrs = (totalMin / 60).toFixed(1);
            const maxMin = Math.max(...grid.map(d => d.hours.reduce((s, h) => s + h.minutesActive, 0)), 1);
            const ratio = totalMin / maxMin;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{day.dayName}</span>
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${ratio * 100}%` }} />
                </div>
                <span className="text-[9px] font-mono text-foreground/60 w-8">{totalHrs}h</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
