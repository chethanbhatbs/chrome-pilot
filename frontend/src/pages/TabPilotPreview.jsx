import { Sidebar } from '@/components/tabpilot/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import {
  Monitor, Search, LayoutGrid, Copy, GripVertical, Save,
  BarChart3, Mouse, Keyboard, Settings, Zap, Download, ArrowRight, ArrowLeft, ExternalLink, Flame
} from 'lucide-react';

const features = [
  { icon: Monitor, title: 'Tab Tree View', desc: 'See all windows and tabs in a real-time tree' },
  { icon: Search, title: 'Global Search', desc: 'Fuzzy search across all tabs instantly' },
  { icon: LayoutGrid, title: 'Group by Domain', desc: 'Toggle between window and domain views' },
  { icon: Copy, title: 'Duplicate Detection', desc: 'Find and close duplicate tabs in one click' },
  { icon: GripVertical, title: 'Drag & Drop', desc: 'Reorder and move tabs between windows' },
  { icon: Save, title: 'Session Manager', desc: 'Save and restore tab sessions' },
  { icon: Flame, title: 'Activity Heatmap', desc: 'See which tabs you visit most frequently' },
  { icon: BarChart3, title: 'Memory & CPU', desc: 'Live memory and CPU usage per tab' },
  { icon: Mouse, title: 'Context Menu', desc: 'Right-click for all tab actions' },
  { icon: Keyboard, title: 'Keyboard Shortcuts', desc: 'Navigate and manage with hotkeys' },
];

export default function TabPilotPreview() {
  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="tabpilot-preview">
      <Toaster richColors position="bottom-right" />

      {/* Browser mockup container */}
      <div className="h-screen flex flex-col">
        {/* Fake browser chrome */}
        <div className="bg-card border-b border-border/50 px-3 py-1.5 flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-tp-duplicate/60" />
            <div className="w-3 h-3 rounded-full bg-tp-audible/60" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-secondary rounded-full px-4 py-1 text-xs text-muted-foreground font-mono flex items-center gap-2 max-w-md w-full">
              <Search size={11} strokeWidth={1.5} />
              <span className="truncate">tabpilot.dev</span>
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Interactive Sidebar */}
          <div className="w-[400px] shrink-0 border-r border-border/50 bg-background flex flex-col" data-testid="sidebar-container">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-card/50">
              <span className="text-xs font-heading font-bold text-primary tracking-tight">TabPilot</span>
              <span className="text-[9px] font-mono text-muted-foreground">v1.0.0</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar />
            </div>
          </div>

          {/* Right: Hero / Marketing content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-16">
              {/* Hero */}
              <div className="mb-16">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-heading font-semibold mb-6">
                  <Zap size={12} strokeWidth={2} />
                  Chrome Extension
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tighter leading-[0.95] mb-6">
                  <span className="text-foreground">Tab</span>
                  <span className="text-primary">Pilot</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground font-body leading-relaxed max-w-lg mb-8">
                  Master your tabs. Control your browser. A powerful sidebar that gives you
                  full control over every window and tab from one clean panel.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="/extension/tabpilot"
                    data-testid="download-extension-btn"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground
                      px-5 py-2.5 rounded-lg font-heading font-bold text-sm
                      shadow-[0_0_20px_rgba(76,201,240,0.3)] hover:shadow-[0_0_30px_rgba(76,201,240,0.4)]
                      transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    <Download size={16} strokeWidth={2} />
                    Download Extension
                  </a>
                  <a
                    href="https://github.com/tabpilot/extension"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="github-link"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm
                      text-muted-foreground hover:text-foreground border border-border/50
                      hover:border-border transition-colors"
                  >
                    View Source
                    <ExternalLink size={13} strokeWidth={1.5} />
                  </a>
                </div>
              </div>

              {/* Interactive hint */}
              <div className="mb-12 p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeft size={14} className="text-primary" strokeWidth={2} />
                  <span className="text-sm font-heading font-bold">Interactive Preview</span>
                </div>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                  The sidebar on the left is a fully functional preview. Try searching, closing tabs,
                  right-clicking for context menus, dragging to reorder, and the Activity Heatmap.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Click tabs', 'Right-click menu', 'Search (Ctrl+Shift+F)', 'Drag & drop', 'Heatmap', 'Save sessions'].map(action => (
                    <span key={action} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {action}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features grid */}
              <div className="mb-16">
                <h2 className="text-lg font-heading font-bold mb-6">Features</h2>
                <div className="grid grid-cols-2 gap-3">
                  {features.map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30
                        transition-colors group"
                      data-testid={`feature-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon
                        size={16}
                        className="text-primary mb-2 group-hover:scale-110 transition-transform"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-xs font-heading font-bold mb-0.5">{title}</h3>
                      <p className="text-[10px] text-muted-foreground font-body leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div className="mb-16">
                <h2 className="text-lg font-heading font-bold mb-4">Keyboard Shortcuts</h2>
                <div className="space-y-1.5">
                  {[
                    ['Ctrl+Shift+E', 'Toggle sidebar'],
                    ['Ctrl+Shift+F', 'Focus search'],
                    ['Ctrl+Shift+D', 'Close duplicates'],
                    ['Arrow Up/Down', 'Navigate tabs'],
                    ['Enter', 'Switch to tab'],
                    ['Delete', 'Close selected tab'],
                    ['Escape', 'Clear search'],
                  ].map(([key, action]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-card border border-border/50">
                      <span className="text-xs text-muted-foreground font-body">{action}</span>
                      <kbd className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded text-foreground/80">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center py-8 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-body">
                  TabPilot - Chrome Tab & Window Manager
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                  Manifest V3 | React | Tailwind CSS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
