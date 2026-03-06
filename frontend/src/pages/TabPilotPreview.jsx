import { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/tabpilot/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import {
  TreePine, Search, Layers, Flame, Focus, Pause, Keyboard,
  StickyNote, Briefcase, Timer, GripVertical, Zap, ArrowRight,
  Monitor, MousePointerClick
} from 'lucide-react';

export default function TabPilotPreview() {
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(380);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(Math.max(startWidth.current + delta, 280), 700);
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="h-screen bg-background text-foreground flex" data-testid="tabpilot-preview">
      <Toaster richColors position="bottom-right" />

      {/* Sidebar */}
      <div
        className="shrink-0 bg-background flex flex-col border-r border-border/40"
        style={{ width: `${sidebarWidth}px` }}
        data-testid="sidebar-container"
      >
        <div className="flex-1 overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* Resize handle */}
      <div
        data-testid="sidebar-resize-handle"
        onMouseDown={handleMouseDown}
        className="w-[5px] shrink-0 cursor-col-resize relative group"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-primary/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full
          bg-border/40 group-hover:bg-primary/60 transition-colors duration-150" />
      </div>

      {/* Main content area — Feature Showcase */}
      <div className="flex-1 overflow-y-auto bg-card/30" data-testid="homepage-content">
        <HomePage />
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      {/* Hero */}
      <HeroSection />
      {/* Quick Start */}
      <QuickStartSection />
      {/* Feature Showcase */}
      <FeatureShowcase />
      {/* Keyboard Shortcuts */}
      <ShortcutsSection />
      {/* Footer */}
      <footer className="text-center pt-8 pb-4 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground/40 font-mono">
          Manifest V3 &middot; React 18 &middot; Tailwind CSS
        </p>
      </footer>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="mb-10" data-testid="hero-section">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20
          flex items-center justify-center shrink-0">
          <span className="text-xl font-heading font-black text-primary">T</span>
        </div>
        <div>
          <h1 className="text-2xl font-heading font-black tracking-tight leading-tight">
            <span className="text-foreground">Tab</span><span className="text-primary">Pilot</span>
          </h1>
          <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">Chrome Tab & Window Manager</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-lg">
        Take control of your browser. TabPilot gives you a powerful sidebar to search, organize,
        monitor, and manage every tab and window — all without leaving your current page.
      </p>
      <div className="flex items-center gap-3 mt-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-primary font-body font-medium">
          <ArrowRight size={12} /> Try it now — the sidebar on the left is fully interactive
        </span>
      </div>
    </div>
  );
}

function QuickStartSection() {
  const steps = [
    { icon: MousePointerClick, text: 'Click any tab in the sidebar to switch to it' },
    { icon: Search, text: 'Use the search bar or press Cmd+K for quick switch' },
    { icon: GripVertical, text: 'Drag tabs to reorder or move between windows' },
    { icon: Monitor, text: 'Right-click any tab for advanced actions' },
  ];

  return (
    <div className="mb-10" data-testid="quick-start-section">
      <SectionLabel>Quick Start</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-card border border-border/40
            hover:border-primary/30 transition-colors">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <step.icon size={12} className="text-primary" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] text-foreground/80 font-body leading-snug">{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureShowcase() {
  const features = [
    {
      icon: TreePine,
      title: 'Tab Tree View',
      description: 'See all open windows and tabs in a collapsible tree. Grouped tabs show with colored borders matching their Chrome group color.',
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      icon: Search,
      title: 'Fuzzy Search & Command Palette',
      description: 'Instantly find any tab by title or URL. Press Cmd+K for a Spotlight-style quick switcher with real-time results.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Flame,
      title: 'Activity Heatmap',
      description: 'Visualize your browsing patterns. See which tabs consume the most time and memory with day, week, or month views.',
      color: 'text-chart-5',
      bgColor: 'bg-chart-5/10',
    },
    {
      icon: Focus,
      title: 'Focus Mode',
      description: 'Hide distractions. Pick a set of tabs to focus on, start a timer, and everything else fades away until you\'re done.',
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
    {
      icon: Pause,
      title: 'Tab Suspension',
      description: 'Reclaim memory by suspending inactive tabs. They stay in your tree but free up resources. Resume them with one click.',
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      icon: Layers,
      title: 'Duplicate Detection',
      description: 'Spots URLs open in multiple tabs, highlights them with a badge, and lets you close extras with one click — keeping one of each.',
      color: 'text-tp-duplicate',
      bgColor: 'bg-tp-duplicate/10',
    },
    {
      icon: Briefcase,
      title: 'Smart Workspaces',
      description: 'Save and restore groups of tabs as workspaces. Comes with presets (Dev, Research, Media) or create your own custom collections.',
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      icon: Timer,
      title: 'Auto-Close Rules',
      description: 'Set timers to automatically close tabs after 15, 30, or 60 minutes of inactivity. Whitelist important domains to keep them safe.',
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      icon: StickyNote,
      title: 'Tab Notes',
      description: 'Attach quick notes to any tab via right-click. Notes persist across sessions and show as a badge on the tab.',
      color: 'text-primary/70',
      bgColor: 'bg-primary/5',
    },
    {
      icon: Keyboard,
      title: 'Keyboard-First Navigation',
      description: 'Arrow keys to browse, Enter to switch, Delete to close, Cmd+K to search. Full keyboard control without touching the mouse.',
      color: 'text-foreground/70',
      bgColor: 'bg-foreground/5',
    },
    {
      icon: GripVertical,
      title: 'Drag & Drop',
      description: 'Reorder tabs within a window or drag them between windows. Grip handles appear on hover for precise control.',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted-foreground/10',
    },
    {
      icon: Zap,
      title: 'Session Manager',
      description: 'Save your current tab layout as a named session. Restore it later to pick up right where you left off.',
      color: 'text-tp-pinned',
      bgColor: 'bg-tp-pinned/10',
    },
  ];

  return (
    <div className="mb-10" data-testid="feature-showcase">
      <SectionLabel>Features</SectionLabel>
      <div className="space-y-2">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color, bgColor }) {
  return (
    <div className="flex items-start gap-3 py-3 px-3.5 rounded-lg bg-card border border-border/40
      hover:border-border/70 transition-all duration-200 group"
      data-testid={`feature-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center shrink-0 mt-0.5
        group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={14} className={color} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <h3 className="text-[12px] font-heading font-semibold text-foreground leading-tight">{title}</h3>
        <p className="text-[11px] text-muted-foreground/70 font-body leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function ShortcutsSection() {
  const shortcuts = [
    ['Cmd+K', 'Quick switch — find and jump to any tab'],
    ['Ctrl+Shift+F', 'Focus the search bar'],
    ['\u2191 \u2193', 'Navigate through the tab list'],
    ['Enter', 'Switch to the selected tab'],
    ['Delete', 'Close the selected tab'],
    ['Right-click', 'Open the context menu for any tab'],
  ];

  return (
    <div className="mb-10" data-testid="shortcuts-section">
      <SectionLabel>Keyboard Shortcuts</SectionLabel>
      <div className="space-y-1">
        {shortcuts.map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-card border border-border/40">
            <span className="text-[11px] text-muted-foreground/80 font-body">{desc}</span>
            <kbd className="text-[9px] font-mono bg-secondary/80 px-2 py-0.5 rounded text-foreground/60 border border-border/40 ml-3 shrink-0">
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="text-[10px] font-heading font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2.5">
      {children}
    </h2>
  );
}
