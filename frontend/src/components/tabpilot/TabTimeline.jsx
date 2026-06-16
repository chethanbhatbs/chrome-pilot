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

export function TabTimeline({ embedded = false }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const timelineData = useTimelineGrid();
  const currentCellRef = useRef(null);
  const scrollContainerRef = useRef(null);
  // When embedded inside the Activity panel, drop the outer padding (the panel
  // supplies it) and the big standalone header (the panel header covers it).
  const wrapCls = embedded ? 'space-y-3' : 'p-3 space-y-3';

  const now = new Date();
  const currentHour = now.getHours();
  const todayRowIdx = 6; // grid is ordered: 6 days ago (0) → today (6)
  const currentColIdx = currentHour; // 0-23, matches grid column index

  // Track mount to trigger scroll animation each time user navigates to timeline
  const [mountKey] = useState(() => Date.now());

  // Auto-scroll to current time when timeline mounts or becomes visible
  useEffect(() => {
    if (currentCellRef.current && scrollContainerRef.current) {
      // Small delay to ensure DOM is laid out before scrolling
      const timer = setTimeout(() => {
        currentCellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [timelineData, mountKey]);

  if (!isExtensionContext()) {
    return (
      <div className={wrapCls} data-testid="tab-timeline-panel">
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
      <div className={wrapCls} data-testid="tab-timeline-panel">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-primary" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Tab Timeline</span>
        </div>
        <div className="text-center py-6 text-muted-foreground text-[11px]">Loading history...</div>
      </div>
    );
  }

  const { grid, totalVisits, mostActiveDay } = timelineData;

  const hourLabels = [];
  for (let h = 0; h <= 23; h++) {
    if (h === 0) hourLabels.push('12a');
    else if (h < 12) hourLabels.push(`${h}a`);
    else if (h === 12) hourLabels.push('12p');
    else hourLabels.push(`${h - 12}p`);
  }

  return (
    <div className={wrapCls} data-testid="tab-timeline-panel">
      {/* Header — compact section label when embedded, full header standalone */}
      {embedded ? (
        <div className="flex items-center gap-1.5">
          <Calendar size={11} className="text-primary" strokeWidth={2} />
          <span className="text-[11px] font-heading text-muted-foreground/70 uppercase tracking-wider">When you browse</span>
          <span className="ml-auto text-[11px] font-mono text-muted-foreground">{totalVisits} visits / wk</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-primary" strokeWidth={2} />
              <span className="text-[12px] font-heading font-bold">Tab Timeline</span>
              <span className="text-[11px] font-mono text-primary/60 bg-primary/10 px-1 py-0.5 rounded">LIVE</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">{totalVisits} visits this week</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            When you browse, over the past 7 days — each cell is one hour, shaded by page visits.
            {mostActiveDay.day && (
              <> Most active: <span className="text-foreground font-semibold">{mostActiveDay.day}</span> ({mostActiveDay.visits} visits).</>
            )}
          </p>
        </>
      )}

      {/* Contributions-style grid */}
      <div ref={scrollContainerRef} className="bg-card rounded-lg border border-border/50 p-4 pr-5 overflow-x-auto scroll-smooth">
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
            <div className="w-8 shrink-0 text-[11px] text-muted-foreground/70 font-mono pr-1 text-right">
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
                <span className="text-[10px] font-mono font-bold text-primary animate-[pulse_3s_ease-in-out_infinite]">NOW</span>
              )}
            </div>
          ))}
          <div className="w-3 shrink-0" />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-border/30">
          <span className="text-[11px] text-muted-foreground/60 font-mono">Less</span>
          <div className="flex items-center gap-[2px]">
            {[0, 0.15, 0.35, 0.55, 0.75, 0.95].map((v, i) => (
              <div key={i} className={`w-3 h-3 rounded-[2px] ${getActivityColor(v)}`} />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground/60 font-mono">More</span>
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
                Visits: <span className="text-foreground font-semibold">{hour.visits}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Intensity: <span className="text-foreground font-semibold">{Math.round(hour.activity * 100)}%</span>
              </div>
            </div>
            {hour.domains.length > 0 && (
              <div>
                <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">Active sites</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hour.domains.map(d => (
                    <span key={d} className="text-[11px] font-body px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
