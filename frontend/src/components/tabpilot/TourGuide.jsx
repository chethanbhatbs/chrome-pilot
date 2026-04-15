import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, ChevronRight, Sparkles, Layout, MousePointerClick, BarChart3, Settings, Rocket } from 'lucide-react';

const TOUR_KEY = 'tabpilot_tour_done_v3';

const STEPS = [
  {
    icon: Sparkles,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    title: 'Welcome to ChromePilot',
    description: 'Your browser just got a major upgrade. Take a quick 30-second tour to discover what you can do.',
    cta: 'Show me around',
  },
  {
    icon: Layout,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    selector: '[data-testid="sidebar-scroll-content"]',
    title: 'Your tabs, organized',
    description: 'All your windows and tabs live here. Click to switch, right-click for options like duplicate, pin, move, or add notes.',
  },
  {
    icon: MousePointerClick,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    selector: '[data-testid="quick-actions"]',
    title: 'Quick actions toolbar',
    description: 'Create tabs, group by domain, enter Focus Mode, select multiple tabs for bulk actions, or open the Heatmap.',
  },
  {
    icon: Settings,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    selector: '[data-testid="sidebar-header"]',
    title: 'Powerful panels',
    description: 'Timeline, Auto-Close, Help, and Settings — each icon in the header opens a full panel with powerful features. Star any tab (or right-click → Add to favorites) to pin it in the Favorites section at the top.',
  },
  {
    icon: BarChart3,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    selector: '[data-testid="stats-bar"]',
    title: 'Live browser stats',
    description: 'Monitor memory, CPU, audio, and duplicates in real time. Hit "Fix All" to clean up duplicate tabs instantly.',
  },
  {
    icon: Rocket,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: "You're all set!",
    description: 'Use Cmd+K for command palette, double-click window names to rename, and close tabs fearlessly — undo is always available.',
    cta: 'Start using ChromePilot',
  },
];

export function TourGuide({ onComplete }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [slideDir, setSlideDir] = useState('in');
  const [highlight, setHighlight] = useState(null);
  const cardRef = useRef(null);

  const current = STEPS[step];
  const total = STEPS.length;
  const isFirst = step === 0;
  const isLast = step === total - 1;

  // Force light theme while tour is active
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    if (wasDark) root.classList.remove('dark');
    return () => {
      // Restore dark class only if the user's setting is still dark
      // (they may have changed it during the tour via settings)
      try {
        const stored = JSON.parse(localStorage.getItem('tabpilot_settings') || '{}');
        if (stored.theme === 'dark') root.classList.add('dark');
      } catch { /* ignore */ }
    };
  }, []);

  // Highlight the target element
  useEffect(() => {
    if (!current.selector) {
      setHighlight(null);
      return;
    }
    const el = document.querySelector(current.selector);
    if (!el) { setHighlight(null); return; }

    const update = () => {
      const r = el.getBoundingClientRect();
      setHighlight({ top: r.top - 4, left: r.left - 4, width: r.width + 8, height: r.height + 8 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [step, current]);

  const transition = useCallback((nextStep) => {
    setSlideDir('out');
    setTimeout(() => {
      setStep(nextStep);
      setSlideDir('in');
    }, 150);
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) handleFinish();
    else transition(step + 1);
  }, [step, isLast, transition]);

  const handleFinish = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(TOUR_KEY, '1');
      onComplete();
    }, 200);
  }, [onComplete]);

  if (!visible) return null;

  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Light overlay — no blur */}
      <div
        className="absolute inset-0 bg-black/20 transition-opacity duration-300"
        onClick={handleFinish}
      />

      {/* Highlight ring around target element */}
      {highlight && (
        <div
          className="absolute rounded-lg pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.20), 0 0 0 3px hsl(var(--primary) / 0.4)',
            zIndex: 1,
          }}
        />
      )}

      {/* Card */}
      <div
        ref={cardRef}
        className={`
          absolute z-[2] w-[300px]
          bg-background border border-border/60
          rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]
          overflow-hidden
          transition-all duration-200 ease-out
          ${slideDir === 'out' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}
        style={
          highlight
            ? { top: Math.max(12, Math.min(highlight.top + highlight.height + 16, window.innerHeight - 320)),
                left: Math.max(12, Math.min(highlight.left, window.innerWidth - 316)) }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient top accent */}
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <div className="p-5">
          {/* Icon + Step badge */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl ${current.iconBg} flex items-center justify-center`}>
              <Icon size={20} className={current.iconColor} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/60 font-body tabular-nums">
                {step + 1}/{total}
              </span>
              <button
                onClick={handleFinish}
                className="cursor-pointer p-1 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-colors"
                data-testid="tour-skip-btn"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-[16px] font-heading font-bold text-foreground leading-tight mb-1.5">
            {current.title}
          </h3>

          {/* Description */}
          <p className="text-[12px] text-muted-foreground font-body leading-relaxed mb-5">
            {current.description}
          </p>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-5 bg-primary'
                    : i < step
                      ? 'w-2 bg-primary/40'
                      : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isFirst && (
              <button
                onClick={handleFinish}
                className="cursor-pointer px-3 h-9 rounded-xl text-[11px] font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                data-testid="tour-skip-link"
              >
                Skip
              </button>
            )}
            {!isFirst && !isLast && (
              <button
                onClick={handleFinish}
                className="cursor-pointer px-3 h-9 rounded-xl text-[11px] font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 h-9 bg-primary text-primary-foreground text-[12px] font-heading font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98]"
              data-testid="tour-next-btn"
            >
              {current.cta || 'Next'}
              {!isLast && <ChevronRight size={14} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function shouldShowTour() {
  return !localStorage.getItem(TOUR_KEY);
}
