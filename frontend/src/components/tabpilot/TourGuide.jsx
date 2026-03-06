import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

const TOUR_KEY = 'tabpilot_tour_done_v2';

const STEPS = [
  {
    id: 'welcome',
    icon: '⚡',
    badge: 'Welcome',
    title: 'You just upgraded your browser',
    description: 'TabPilot gives you complete control over your Chrome tabs. This 30-second tour will show you everything.',
    center: true,
    cta: 'Start tour',
  },
  {
    id: 'tabs',
    selector: '[data-testid="sidebar-scroll-content"]',
    icon: '📑',
    badge: 'Tab List',
    title: 'All your tabs, organized',
    description: 'Windows and tabs are listed here. Click to switch, hover for a live preview, right-click for options like duplicate, note, move, or suspend.',
    placement: 'right',
    hint: 'Try right-clicking any tab',
  },
  {
    id: 'toolbar',
    selector: '[data-testid="quick-actions"]',
    icon: '🔧',
    badge: 'Toolbar',
    title: 'Quick Actions at your fingertips',
    description: 'Create tabs, toggle Domain view (groups by website), activate Focus Mode to block distractions, or open the Heatmap to see your browsing patterns.',
    placement: 'bottom',
    hint: 'Try clicking "Domain" to group by site',
  },
  {
    id: 'features',
    selector: '[data-testid="sidebar-header"]',
    icon: '✨',
    badge: 'Panels',
    title: 'Six powerful panels',
    description: 'Timeline, Notes, Workspaces, Auto-Close, Help, and Settings. Each icon opens a full panel. Try Workspaces to save tab sets for different contexts.',
    placement: 'bottom',
    hint: 'Press Ctrl+1 to switch workspaces',
  },
  {
    id: 'stats',
    selector: '[data-testid="stats-bar"]',
    icon: '📊',
    badge: 'Live Stats',
    title: 'Real-time browser health',
    description: 'Memory, CPU, audio tabs, and duplicates — updated every second. If dupes appear, hit "Fix All" to instantly clean up.',
    placement: 'top',
    hint: 'Stats update every second',
  },
  {
    id: 'done',
    icon: '🎯',
    badge: "You're ready",
    title: 'TabPilot is all yours',
    description: 'Press ⌘K (or Ctrl+K) for the command palette. Double-click any window name to rename it. Close tabs — use Undo if you change your mind.',
    center: true,
    cta: "Let's go!",
  },
];

export function TourGuide({ onComplete }) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [cardStyle, setCardStyle] = useState({});
  const [arrowDir, setArrowDir] = useState(null);
  const [animating, setAnimating] = useState(false);
  const cardRef = useRef(null);

  const current = STEPS[step];
  const total = STEPS.length;

  const updatePositions = useCallback(() => {
    if (!current.selector) {
      setSpotlight(null);
      setCardStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      setArrowDir(null);
      return;
    }

    const el = document.querySelector(current.selector);
    if (!el) return;

    const pad = 10;
    const r = el.getBoundingClientRect();
    setSpotlight({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });

    const cardW = 310;
    const cardH = 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const placement = current.placement || 'right';

    let top, left, arrowDirection = null;

    if (placement === 'bottom') {
      top = r.bottom + pad + 12;
      left = Math.min(r.left + r.width / 2 - cardW / 2, vw - cardW - 16);
      left = Math.max(16, left);
      arrowDirection = 'up';
    } else if (placement === 'top') {
      top = r.top - cardH - pad - 12;
      left = Math.min(r.left + r.width / 2 - cardW / 2, vw - cardW - 16);
      left = Math.max(16, left);
      arrowDirection = 'down';
    } else {
      // right
      top = Math.min(r.top + r.height / 2 - cardH / 2, vh - cardH - 16);
      top = Math.max(16, top);
      left = r.right + 16;
      if (left + cardW > vw - 16) {
        left = r.left - cardW - 16;
        arrowDirection = 'right';
      } else {
        arrowDirection = 'left';
      }
    }

    top = Math.max(12, Math.min(top, vh - cardH - 12));
    left = Math.max(12, Math.min(left, vw - cardW - 12));

    setCardStyle({ top, left, transform: 'none', width: cardW });
    setArrowDir(arrowDirection);
  }, [step, current]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  const goTo = useCallback((nextStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 180);
  }, []);

  const handleNext = useCallback(() => {
    if (step < total - 1) goTo(step + 1);
    else handleFinish();
  }, [step, total, goTo]);

  const handlePrev = useCallback(() => {
    if (step > 0) goTo(step - 1);
  }, [step, goTo]);

  const handleFinish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    onComplete();
  }, [onComplete]);

  // Arrow indicator position
  const arrowStyle = (() => {
    if (!arrowDir || !spotlight) return {};
    const base = { position: 'absolute', width: 10, height: 10, background: 'var(--popover)', transform: 'rotate(45deg)', zIndex: 1 };
    if (arrowDir === 'up') return { ...base, top: -5, left: '50%', marginLeft: -5, borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' };
    if (arrowDir === 'down') return { ...base, bottom: -5, left: '50%', marginLeft: -5, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' };
    if (arrowDir === 'left') return { ...base, left: -5, top: '50%', marginTop: -5, borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' };
    if (arrowDir === 'right') return { ...base, right: -5, top: '50%', marginTop: -5, borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)' };
    return {};
  })();

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Spotlight with glow ring */}
      {spotlight && (
        <div
          className="absolute rounded-xl tour-spotlight-glow"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
            border: '2px solid hsl(var(--primary))',
            zIndex: 1,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {/* Tour card */}
      <div
        ref={cardRef}
        className={`absolute z-[2] w-[310px] bg-popover border border-border rounded-2xl shadow-2xl overflow-visible transition-opacity duration-180 ${animating ? 'opacity-0' : 'opacity-100'}`}
        style={typeof cardStyle.top === 'number' ? cardStyle : { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        {arrowDir && <div style={arrowStyle} />}

        {/* Progress bar top */}
        <div className="h-[3px] bg-secondary/50 w-full rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0">
                {current.icon}
              </div>
              {/* Badge */}
              <div>
                <span className="text-[9px] font-mono text-primary/70 uppercase tracking-widest">{current.badge}</span>
                <div className="text-[9px] text-muted-foreground/50 font-mono">{step + 1} / {total}</div>
              </div>
            </div>
            {/* Skip */}
            <button
              onClick={handleFinish}
              className="cursor-pointer p-1 rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors"
              data-testid="tour-skip-btn"
            >
              <X size={13} strokeWidth={1.5} />
            </button>
          </div>

          {/* Content */}
          <h3 className="text-[14px] font-heading font-bold text-foreground leading-snug mb-2">
            {current.title}
          </h3>
          <p className="text-[11px] text-muted-foreground font-body leading-relaxed mb-3">
            {current.description}
          </p>

          {/* Hint pill */}
          {current.hint && (
            <div className="inline-flex items-center gap-1.5 bg-primary/[0.08] border border-primary/20 rounded-full px-2.5 py-0.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-mono text-primary/80">{current.hint}</span>
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${i === step ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50'}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="cursor-pointer flex items-center justify-center w-9 h-9 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                data-testid="tour-prev-btn"
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
              </button>
            )}
            <button
              onClick={handleNext}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 h-9 bg-primary text-primary-foreground text-[12px] font-heading font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
              data-testid="tour-next-btn"
            >
              {step < total - 1 ? (
                <>{current.cta || 'Continue'} <ArrowRight size={13} strokeWidth={2} /></>
              ) : (
                current.cta || "Let's go!"
              )}
            </button>
          </div>

          {/* Skip link */}
          {step === 0 && (
            <button
              onClick={handleFinish}
              className="cursor-pointer w-full mt-2.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground font-body transition-colors"
              data-testid="tour-skip-link"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function shouldShowTour() {
  return !localStorage.getItem(TOUR_KEY);
}
