import { useState, useEffect } from 'react';
import { isExtensionContext } from '@/utils/chromeAdapter';

const AVG_MIN_PER_VISIT = 2; // conservative estimate per page visit

function msFor(filter) {
  const d = 86_400_000;
  return { day: d, week: 7 * d, month: 30 * d }[filter] ?? 7 * d;
}

function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function processItems(items, timeFilter) {
  const now = Date.now();

  // ── Domain aggregation ──────────────────────────────────────────────
  const domainMap = {};
  items.forEach(item => {
    if (!item.url) return;
    try {
      const host = new URL(item.url).hostname.replace(/^www\./, '');
      if (host.startsWith('chrome') || host === 'newtab') return;
      if (!domainMap[host]) domainMap[host] = 0;
      domainMap[host] += 1;
    } catch { /* invalid URL */ }
  });

  const minPerVisit = timeFilter === 'day' ? 1 : AVG_MIN_PER_VISIT;
  const topDomains = Object.entries(domainMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([domain, visits]) => ({
      domain,
      visits,
      minutes: visits * minPerVisit,
    }));

  // ── URL visit counts (for matching to open tabs) ─────────────────
  const urlVisitCounts = {};
  items.forEach(item => {
    if (!item.url) return;
    urlVisitCounts[item.url] = item.visitCount || 1;
  });

  // ── Timeline ────────────────────────────────────────────────────────
  let timelineData;
  if (timeFilter === 'day') {
    const hourLabels = ['12am','3am','6am','9am','12pm','3pm','6pm','9pm'];
    const currentHour = new Date().getHours();
    const buckets = Array.from({ length: 8 }, (_, i) => ({ hour: hourLabels[i], visits: 0, minutes: 0 }));
    items.forEach(item => {
      if (!item.lastVisitTime) return;
      if (item.lastVisitTime < getStartOfToday()) return;
      const h = new Date(item.lastVisitTime).getHours();
      if (h > currentHour) return;
      const bucketIdx = Math.floor(h / 3);
      buckets[bucketIdx].visits += 1;
    });
    // Estimate active minutes: each page visit ≈ 1 minute of browsing
    // Capped at 180 min per 3-hour bucket (physically possible maximum)
    buckets.forEach(b => { b.minutes = Math.min(180, b.visits); });
    timelineData = buckets;
  } else if (timeFilter === 'week') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const visitCounts = Array(7).fill(0);
    items.forEach(item => {
      if (!item.lastVisitTime) return;
      const dayIdx = (new Date(item.lastVisitTime).getDay() + 6) % 7; // 0=Mon
      visitCounts[dayIdx] += 1;
    });
    // Cap each day at 16 hours (realistic max active browsing)
    timelineData = days.map((day, i) => ({
      day,
      visits: visitCounts[i],
      hours: parseFloat(Math.min(16, visitCounts[i] * AVG_MIN_PER_VISIT / 60).toFixed(1)),
    }));
  } else {
    const weeks = ['W1', 'W2', 'W3', 'W4'];
    const visitCounts = Array(4).fill(0);
    items.forEach(item => {
      if (!item.lastVisitTime) return;
      const daysAgo = (now - item.lastVisitTime) / 86_400_000;
      const wIdx = Math.min(3, Math.floor(daysAgo / 7));
      visitCounts[3 - wIdx] += 1;
    });
    timelineData = weeks.map((week, i) => ({
      week,
      visits: visitCounts[i],
      hours: parseFloat(Math.min(80, visitCounts[i] * AVG_MIN_PER_VISIT / 60).toFixed(1)),
    }));
  }

  const totalVisits = items.length;

  // Compute total minutes from timeline data (matches what the chart shows)
  let totalMinutes;
  if (timeFilter === 'day') {
    totalMinutes = timelineData.reduce((s, b) => s + b.minutes, 0);
  } else if (timeFilter === 'week') {
    totalMinutes = timelineData.reduce((s, d) => s + d.hours * 60, 0);
  } else {
    totalMinutes = timelineData.reduce((s, w) => s + w.hours * 60, 0);
  }

  return { topDomains, timelineData, totalVisits, totalMinutes, urlVisitCounts };
}

/**
 * Returns real Chrome history data in extension context, null in web preview.
 */
export function useHistoryData(timeFilter) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isExtensionContext()) return;

    async function fetchHistory() {
      try {
        // For 'day' filter, use since midnight today (not 24h ago)
        const startTime = timeFilter === 'day'
          ? getStartOfToday()
          : Date.now() - msFor(timeFilter);
        const items = await chrome.history.search({ text: '', startTime, maxResults: 10_000 });
        setData(processItems(items, timeFilter));
      } catch (e) {
        console.error('TabPilot history error:', e);
      }
    }

    fetchHistory();
  }, [timeFilter]);

  return data;
}

/**
 * Returns real Chrome history for 7-day timeline grid (TabTimeline).
 */
export function useTimelineGrid() {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isExtensionContext()) return;

    async function fetchHistory() {
      try {
        const startTime = Date.now() - 7 * 86_400_000;
        const items = await chrome.history.search({ text: '', startTime, maxResults: 10_000 });

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const grid = [];
        const currentHour = new Date().getHours();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 6; d >= 0; d--) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          date.setHours(0, 0, 0, 0);
          const dayName = days[date.getDay()];
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayStart = date.getTime();
          const dayEnd = dayStart + 86_400_000;
          const isToday = date.getTime() === today.getTime();

          // Filter items for this day
          const dayItems = items.filter(item =>
            item.lastVisitTime >= dayStart && item.lastVisitTime < dayEnd
          );

          const hours = [];
          for (let h = 6; h <= 23; h++) {
            // Skip future hours on today
            if (isToday && h > currentHour) {
              hours.push({ hour: h, minutesActive: 0, activity: 0, domains: [] });
              continue;
            }

            const hourStart = dayStart + h * 3_600_000;
            const hourEnd = hourStart + 3_600_000;
            const hourItems = dayItems.filter(item =>
              item.lastVisitTime >= hourStart && item.lastVisitTime < hourEnd
            );

            const minutesActive = Math.min(55, hourItems.length * AVG_MIN_PER_VISIT);
            const activity = Math.min(1, minutesActive / 55);

            // Get domains active in this hour
            const domainSet = new Set();
            hourItems.forEach(item => {
              try {
                const host = new URL(item.url).hostname.replace(/^www\./, '');
                if (!host.startsWith('chrome') && host !== 'newtab') domainSet.add(host);
              } catch {}
            });

            hours.push({
              hour: h,
              minutesActive,
              activity,
              domains: Array.from(domainSet).slice(0, 3),
            });
          }

          grid.push({ dayName, dateStr, hours, date: new Date(date) });
        }

        const totalMinutes = grid.reduce((sum, day) =>
          sum + day.hours.reduce((s, h) => s + h.minutesActive, 0), 0
        );

        let mostActiveDay = { day: '', hours: '0' };
        grid.forEach(day => {
          const total = day.hours.reduce((s, h) => s + h.minutesActive, 0);
          if (total > parseFloat(mostActiveDay.hours) * 60) {
            mostActiveDay = { day: day.dayName, hours: (total / 60).toFixed(1) };
          }
        });

        setData({
          grid,
          totalHours: (totalMinutes / 60).toFixed(1),
          mostActiveDay,
        });
      } catch (e) {
        console.error('TabPilot timeline error:', e);
      }
    }

    fetchHistory();
  }, []);

  return data;
}
