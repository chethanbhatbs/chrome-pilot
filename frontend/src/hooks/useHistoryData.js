import { useState, useEffect } from 'react';
import { isExtensionContext } from '@/utils/chromeAdapter';

const AVG_MIN_PER_VISIT = 3; // conservative: ~3 min per page visit

function msFor(filter) {
  const d = 86_400_000;
  return { day: d, week: 7 * d, month: 30 * d }[filter] ?? 7 * d;
}

function processItems(items, timeFilter) {
  // ── Domain aggregation ──────────────────────────────────────────────
  const domainMap = {};
  items.forEach(item => {
    if (!item.url) return;
    try {
      const host = new URL(item.url).hostname.replace(/^www\./, '');
      if (host.startsWith('chrome') || host === 'newtab') return;
      if (!domainMap[host]) domainMap[host] = 0;
      domainMap[host] += item.visitCount || 1;
    } catch { /* invalid URL */ }
  });

  const topDomains = Object.entries(domainMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([domain, visits]) => ({
      domain,
      hours: parseFloat((visits * AVG_MIN_PER_VISIT / 60).toFixed(1)),
    }));

  // ── Timeline ────────────────────────────────────────────────────────
  let timelineData;
  if (timeFilter === 'day') {
    const buckets = Array.from({ length: 8 }, (_, i) => ({ hour: `${i * 3}h`, minutes: 0 }));
    items.forEach(item => {
      if (!item.lastVisitTime) return;
      const h = new Date(item.lastVisitTime).getHours();
      buckets[Math.floor(h / 3)].minutes = Math.round(
        (buckets[Math.floor(h / 3)].minutes || 0) + AVG_MIN_PER_VISIT
      );
    });
    timelineData = buckets;
  } else if (timeFilter === 'week') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = Array(7).fill(0);
    items.forEach(item => {
      if (!item.lastVisitTime) return;
      const dayIdx = (new Date(item.lastVisitTime).getDay() + 6) % 7; // 0=Mon
      counts[dayIdx] += AVG_MIN_PER_VISIT / 60;
    });
    timelineData = days.map((day, i) => ({ day, hours: parseFloat(counts[i].toFixed(1)) }));
  } else {
    const weeks = ['W1', 'W2', 'W3', 'W4'];
    const counts = Array(4).fill(0);
    const now = Date.now();
    items.forEach(item => {
      if (!item.lastVisitTime) return;
      const daysAgo = (now - item.lastVisitTime) / 86_400_000;
      const wIdx = Math.min(3, Math.floor(daysAgo / 7));
      counts[3 - wIdx] += AVG_MIN_PER_VISIT / 60;
    });
    timelineData = weeks.map((week, i) => ({ week, hours: parseFloat(counts[i].toFixed(1)) }));
  }

  const totalVisits = items.reduce((s, i) => s + (i.visitCount || 1), 0);
  const totalHours = parseFloat((totalVisits * AVG_MIN_PER_VISIT / 60).toFixed(1));

  return { topDomains, timelineData, totalVisits, totalHours };
}

/**
 * Returns real Chrome history data in extension context, null in web preview.
 * null = use mock data fallback.
 */
export function useHistoryData(timeFilter) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isExtensionContext()) return; // web preview → keep null, use mock

    async function fetchHistory() {
      try {
        const startTime = Date.now() - msFor(timeFilter);
        const items = await chrome.history.search({ text: '', startTime, maxResults: 10_000 });
        setData(processItems(items, timeFilter));
      } catch (e) {
        console.error('TabPilot history error:', e);
        // stay null → HeatmapPanel uses mock fallback
      }
    }

    fetchHistory();
  }, [timeFilter]);

  return data;
}
