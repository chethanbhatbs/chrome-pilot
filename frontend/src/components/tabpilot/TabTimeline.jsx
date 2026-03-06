import { useMemo, useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDomain } from '@/utils/grouping';
import { DOMAIN_TIME_SPENT } from '@/utils/mockData';

// Generate mock hourly activity data for the past 7 days
function generateTimelineData() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const domains = Object.keys(DOMAIN_TIME_SPENT);
  const data = [];

  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dayName = days[date.getDay()];
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const hours = [];
    for (let h = 6; h <= 23; h++) {
      // Simulate activity: higher during work hours, lower on weekends
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isWorkHour = h >= 9 && h <= 17;
      const baseActivity = isWeekend ? 0.15 : isWorkHour ? 0.7 : 0.2;
      const activity = Math.max(0, Math.min(1, baseActivity + (Math.random() * 0.4 - 0.2)));
      const minutesActive = Math.round(activity * 55);

      // Pick random domains active during this hour
      const activeDomains = domains
        .filter(() => Math.random() < activity * 0.5)
        .slice(0, 3);

      hours.push({
        hour: h,
        minutesActive,
        activity,
        domains: activeDomains,
      });
    }

    data.push({ dayName, dateStr, hours, date: new Date(date) });
  }

  return data;
}

const TIMELINE_DATA = generateTimelineData();

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

  const hourLabels = useMemo(() => {
    const labels = [];
    for (let h = 6; h <= 23; h++) {
      labels.push(h <= 12 ? `${h}${h === 12 ? 'p' : 'a'}` : `${h - 12}p`);
    }
    return labels;
  }, []);

  const totalHoursThisWeek = useMemo(() => {
    return (TIMELINE_DATA.reduce((sum, day) =>
      sum + day.hours.reduce((s, h) => s + h.minutesActive, 0), 0
    ) / 60).toFixed(1);
  }, []);

  const mostActiveDay = useMemo(() => {
    let max = 0, maxDay = '';
    TIMELINE_DATA.forEach(day => {
      const total = day.hours.reduce((s, h) => s + h.minutesActive, 0);
      if (total > max) { max = total; maxDay = day.dayName; }
    });
    return { day: maxDay, hours: (max / 60).toFixed(1) };
  }, []);

  return (
    <div className="p-3 space-y-3" data-testid="tab-timeline-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-primary" strokeWidth={2} />
          <span className="text-[12px] font-heading font-bold">Tab Timeline</span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">{totalHoursThisWeek}h this week</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Your browsing activity over the past 7 days. Each cell is one hour.
        Most active: <span className="text-foreground font-semibold">{mostActiveDay.day}</span> ({mostActiveDay.hours}h).
      </p>

      {/* Contributions-style grid */}
      <div className="bg-card rounded-lg border border-border/50 p-3 overflow-x-auto">
        {/* Hour labels */}
        <div className="flex items-center gap-0 mb-1">
          <div className="w-8 shrink-0" />
          {hourLabels.map((label, i) => (
            <div key={i} className="flex-1 min-w-[18px] text-center text-[7px] text-muted-foreground/40 font-mono">
              {i % 3 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {TIMELINE_DATA.map((day, di) => (
          <div key={di} className="flex items-center gap-0 mb-[2px]">
            <div className="w-8 shrink-0 text-[8px] text-muted-foreground/50 font-mono pr-1 text-right">
              {day.dayName}
            </div>
            {day.hours.map((hour, hi) => (
              <div
                key={hi}
                className={`flex-1 min-w-[18px] h-[18px] rounded-[3px] mx-[1px] cursor-pointer
                  ${getActivityColor(hour.activity)}
                  ${selectedCell?.day === di && selectedCell?.hour === hi ? 'ring-1 ring-primary' : ''}
                  hover:ring-1 hover:ring-foreground/30 transition-all duration-100`}
                onClick={() => setSelectedCell(selectedCell?.day === di && selectedCell?.hour === hi ? null : { day: di, hour: hi })}
                data-testid={`timeline-cell-${di}-${hi}`}
              />
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
          <span className="text-[8px] text-muted-foreground/40 font-mono">Less</span>
          <div className="flex items-center gap-[2px]">
            {[0, 0.15, 0.35, 0.55, 0.75, 0.95].map((v, i) => (
              <div key={i} className={`w-3 h-3 rounded-[2px] ${getActivityColor(v)}`} />
            ))}
          </div>
          <span className="text-[8px] text-muted-foreground/40 font-mono">More</span>
        </div>
      </div>

      {/* Selected cell detail */}
      {selectedCell && (
        <div className="bg-card rounded-lg border border-border/50 p-2.5 animate-slide-in" data-testid="timeline-detail">
          {(() => {
            const day = TIMELINE_DATA[selectedCell.day];
            const hour = day.hours[selectedCell.hour];
            const h = hour.hour;
            const timeLabel = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
            return (
              <>
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
                    <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Active sites</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hour.domains.map(d => (
                        <span key={d} className="text-[9px] font-body px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {DOMAIN_TIME_SPENT[d]?.label || d.replace(/^www\./, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Daily breakdown */}
      <div>
        <span className="text-[9px] font-heading text-muted-foreground/50 uppercase tracking-wider">Daily Breakdown</span>
        <div className="space-y-1 mt-1.5">
          {TIMELINE_DATA.map((day, i) => {
            const totalMin = day.hours.reduce((s, h) => s + h.minutesActive, 0);
            const totalHrs = (totalMin / 60).toFixed(1);
            const maxMin = Math.max(...TIMELINE_DATA.map(d => d.hours.reduce((s, h) => s + h.minutesActive, 0)));
            const ratio = totalMin / maxMin;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground/50 w-8 text-right">{day.dayName}</span>
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
