import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Zap } from 'lucide-react';

const TOUR_KEY = 'tabpilot_tour_done';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to TabPilot!',
    description: 'Your intelligent tab manager. Let\'s take a 30-second tour to get you up to speed.',
    center: true,
    emoji: '👋',
  },
  {
    id: 'toolbar',
    selector: '[data-testid="quick-actions"]',
    title: 'Quick Actions',
    description: 'Create new tabs, toggle domain/window view, enable heatmap or focus mode. Domain mode groups tabs by website.',
    placement: 'bottom',
  },
  {
    id: 'tabs',
    selector: '[data-testid="sidebar-scroll-content"]',
    title: 'Your Tab List',
    description: 'All open tabs organized by window. Click any tab to switch. Hover for a preview. Right-click for more options.',
    placement: 'right',
  },
  {
    id: 'header-panels',
    selector: '[data-testid="sidebar-header"]',
    title: 'Feature Panels',
    description: 'Access Timeline, Notes, Workspaces, Auto-Close Rules, Help, and Settings. Each icon opens a dedicated panel.',
    placement: 'bottom',
  },
  {
    id: 'stats',
    selector: '[data-testid="stats-bar"]',
    title: 'Live Statistics',
    description: 'Monitor memory usage, CPU, audio tabs, and duplicate count in real time.',
    placement: 'top',
  },
  {
    id: 'done',
    title: 'You\'re all set!',
    description: 'Press Cmd+K (or Ctrl+K) anytime to open the command palette. Double-click a window name to rename it.',
    center: true,
    emoji: '🚀',
  },
];

export function TourGuide({ onComplete }) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [cardPos, setCardPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });

  const currentStep = STEPS[step];

  useEffect(() => {
    if (!currentStep.selector) {
      setSpotlightRect(null);
      setCardPos({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(currentStep.selector);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const pad = 8;
      setSpotlightRect({ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });

      const cardW = 280;
      const cardH = 160;
      const placement = currentStep.placement || 'right';
      let top, left;

      if (placement === 'bottom') {
        top = rect.bottom + pad + 8;
        left = rect.left + rect.width / 2 - cardW / 2;
      } else if (placement === 'top') {
        top = rect.top - cardH - pad - 8;
        left = rect.left + rect.width / 2 - cardW / 2;
      } else {
        // right
        top = rect.top + rect.height / 2 - cardH / 2;
        left = rect.right + pad + 16;
      }

      // Clamp to viewport
      top = Math.max(12, Math.min(top, window.innerHeight - cardH - 12));
      left = Math.max(12, Math.min(left, window.innerWidth - cardW - 12));

      setCardPos({ top, left, transform: 'none' });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [step, currentStep]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleFinish();
  }, [step]);

  const handlePrev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  const handleFinish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 transition-all duration-300" onClick={handleFinish} />

      {/* Spotlight box */}
      {spotlightRect && (
        <div
          className="absolute rounded-xl transition-all duration-300"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.70)',
            border: '2px solid rgba(87,165,255,0.8)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Tour card */}
      <div
        className="absolute z-[2] w-[280px] bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-in"
        style={typeof cardPos.top === 'number' ? cardPos : { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-secondary w-full">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-4">
          {/* Skip */}
          <button
            onClick={handleFinish}
            className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
            data-testid="tour-skip-btn"
          >
            <X size={13} strokeWidth={1.5} />
          </button>

          {/* Step counter */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${i === step ? 'w-3 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/30'}`}
                />
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground/50 font-mono ml-1">{step + 1}/{STEPS.length}</span>
          </div>

          {/* Content */}
          {currentStep.emoji && (
            <div className="text-2xl mb-2">{currentStep.emoji}</div>
          )}
          <h3 className="text-[13px] font-heading font-bold text-foreground mb-1.5">{currentStep.title}</h3>
          <p className="text-[11px] text-muted-foreground font-body leading-relaxed">{currentStep.description}</p>

          {/* Controls */}
          <div className="flex items-center gap-2 mt-4">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="cursor-pointer flex items-center gap-1 text-[10px] font-body text-muted-foreground hover:text-foreground transition-colors"
                data-testid="tour-prev-btn"
              >
                <ChevronLeft size={12} strokeWidth={1.5} /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 h-8 bg-primary text-primary-foreground text-[11px] font-heading font-semibold rounded-lg hover:bg-primary/90 transition-colors active:scale-[0.98]"
              data-testid="tour-next-btn"
            >
              {step < STEPS.length - 1 ? (
                <>Next <ChevronRight size={12} strokeWidth={2} /></>
              ) : (
                <><Zap size={12} strokeWidth={2} /> Let's Go!</>
              )}
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
