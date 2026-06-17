import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Search, LayoutGrid, Settings } from 'lucide-react';

const TOUR_KEY = 'tabpilot_tour_done_v5';

// Each step points at a real element (selector) and explains exactly what it does.
const STEPS = [
  {
    icon: Search,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    selector: '[data-testid="search-bar"]',
    title: 'Find any tab',
    description: 'Type here to filter every open tab by title or URL — or press Ctrl+K to jump straight to one.',
  },
  {
    icon: LayoutGrid,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    selector: '[data-testid="quick-actions"]',
    title: 'The toolbar',
    description: 'New tab · group by Site · Focus mode · multi-Select. Right-click any tab for pin, mute, move and more.',
  },
  {
    icon: Settings,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    selector: '[data-testid="profile-bottom-bar"]',
    title: 'Profile & settings',
    description: 'Bottom-right: your profile, Help and Settings. Live tab stats (count, audio, duplicates) sit on the left.',
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

  const handlePrev = useCallback(() => {
    if (!isFirst) transition(step - 1);
  }, [step, isFirst, transition]);

  const handleFinish = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(TOUR_KEY, '1');
      onComplete();
    }, 200);
  }, [onComplete]);

  // Keyboard navigation: ← / → to move, Esc to close.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleFinish();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNext, handlePrev, handleFinish]);

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
            ? (() => {
                // Place the card above the target if it sits in the lower half
                // (e.g. the footer), otherwise below it.
                const above = highlight.top > window.innerHeight * 0.5;
                return {
                  top: above
                    ? Math.max(12, highlight.top - 236)
                    : Math.min(highlight.top + highlight.height + 16, window.innerHeight - 240),
                  left: Math.max(12, Math.min(highlight.left, window.innerWidth - 316)),
                };
              })()
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

          {/* Actions — Back / Next (← → keys work too) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="cursor-pointer flex items-center gap-1 px-3 h-9 rounded-xl text-[11px] font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              data-testid="tour-back-btn"
            >
              <ChevronLeft size={14} strokeWidth={2} /> Back
            </button>
            <button
              onClick={handleNext}
              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 h-9 bg-primary text-primary-foreground text-[12px] font-heading font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98]"
              data-testid="tour-next-btn"
            >
              {isLast ? 'Done' : 'Next'}
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
