import { useState, useEffect, useMemo } from 'react';
import { Focus, X, Timer, Zap } from 'lucide-react';
import { getFaviconUrl, getDomain } from '@/utils/grouping';
import { TAB_METRICS } from '@/utils/mockData';

export function FocusMode({ allTabs, visitCounts, onSwitch, onExit }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const focusTabs = useMemo(() => {
    return allTabs
      .map(tab => ({
        ...tab,
        visits: (visitCounts[tab.id] || 0) + (TAB_METRICS[tab.id]?.visitCount || 0),
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
  }, [allTabs, visitCounts]);

  return (
    <div className="flex flex-col h-full" data-testid="focus-mode-panel">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
          <Focus size={20} className="text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-sm font-heading font-bold mb-1">Focus Mode</h2>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Only your core workflow tabs are shown. Everything else is hidden to help you concentrate.
        </p>
      </div>

      {/* Timer */}
      <div className="mx-4 mb-4 p-3 rounded-lg bg-card border border-border text-center">
        <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
          <Timer size={11} strokeWidth={1.5} />
          <span className="text-[10px] font-heading uppercase tracking-wider">Focus Time</span>
        </div>
        <span className="text-2xl font-mono font-bold text-foreground tracking-wider">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Focus tabs */}
      <div className="flex-1 px-2">
        <div className="flex items-center gap-1.5 px-2 mb-2">
          <Zap size={10} className="text-primary" strokeWidth={2} />
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
            Your Workflow
          </span>
        </div>
        <div className="space-y-0.5">
          {focusTabs.map((tab, idx) => (
            <div
              key={tab.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer
                hover:bg-muted/50 transition-colors group"
              onClick={() => onSwitch(tab.id)}
              data-testid={`focus-tab-${tab.id}`}
            >
              <span className="text-[10px] font-mono text-muted-foreground w-3 text-right">
                {idx + 1}
              </span>
              <img
                src={getFaviconUrl(tab.url)}
                alt=""
                className="w-4 h-4 rounded-[3px] shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-body truncate">{tab.title}</div>
                <div className="text-[10px] text-muted-foreground/60 truncate">{getDomain(tab.url)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exit button */}
      <div className="p-3">
        <button
          data-testid="exit-focus-mode-btn"
          onClick={onExit}
          className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-heading font-semibold
            rounded-lg border border-border text-muted-foreground hover:text-foreground
            hover:bg-muted/50 transition-colors"
        >
          <X size={12} strokeWidth={1.5} />
          Exit Focus Mode
        </button>
      </div>
    </div>
  );
}
