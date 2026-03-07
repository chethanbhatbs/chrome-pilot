import {
  HelpCircle, Keyboard, Search, GripVertical, Save, Flame, Focus, Pause,
  LayoutGrid, Mail, ShieldCheck, CheckSquare, Zap, StickyNote, Briefcase,
  Timer, MousePointer, Command, Users
} from 'lucide-react';

const categories = [
  {
    title: 'Find & Navigate',
    items: [
      { icon: Search, text: 'Fuzzy search any tab by title or URL' },
      { icon: LayoutGrid, text: 'Sites view groups tabs by domain' },
      { icon: GripVertical, text: 'Drag tabs to reorder or move between windows' },
      { icon: MousePointer, text: 'Right-click for pin, mute, move, copy URL' },
    ],
  },
  {
    title: 'Organize & Focus',
    items: [
      { icon: Focus, text: 'Focus mode hides everything except chosen tabs' },
      { icon: Briefcase, text: 'Workspaces isolate tab groups per project' },
      { icon: CheckSquare, text: 'Select mode for bulk-closing multiple tabs' },
      { icon: StickyNote, text: 'Attach notes to tabs — persists across sessions' },
      { icon: Users, text: 'Switch between Chrome profiles instantly' },
    ],
  },
  {
    title: 'Save & Automate',
    items: [
      { icon: Save, text: 'Sessions snapshot & restore all windows/tabs' },
      { icon: Timer, text: 'Auto-close rules close idle tabs on a timer' },
      { icon: Pause, text: 'Suspend inactive tabs to free memory' },
      { icon: Flame, text: 'Activity heatmap shows browsing patterns' },
    ],
  },
];

const shortcuts = [
  { keys: '⌘K', action: 'Quick switch' },
  { keys: '↑ ↓', action: 'Navigate' },
  { keys: '↵', action: 'Switch tab' },
  { keys: '⌫', action: 'Close tab' },
];

export function HelpPanel({ onBack }) {
  const handleFeedback = () => {
    const subject = encodeURIComponent('TabPilot Feedback');
    const body = encodeURIComponent('Hi,\n\nI have the following feedback about TabPilot:\n\n');
    window.open(`mailto:bschethanbhat@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="p-3 space-y-2.5" data-testid="help-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <HelpCircle size={13} className="text-primary" strokeWidth={1.5} />
          <span className="text-xs font-heading font-bold">Guide & Help</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded">v1.1.0</span>
      </div>

      {/* Feature categories as compact cards */}
      {categories.map(({ title, items }) => (
        <div key={title} className="rounded-lg border border-border/40 bg-card/50 p-2">
          <span className="text-[9px] font-heading font-bold text-primary uppercase tracking-wider">{title}</span>
          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
            {items.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-1.5">
                <Icon size={10} className="text-primary/50 shrink-0 mt-[1px]" strokeWidth={1.5} />
                <span className="text-[9.5px] text-foreground/70 leading-tight">{text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Shortcuts — inline row */}
      <div className="rounded-lg bg-card border border-border/40 px-2.5 py-2">
        <div className="flex items-center gap-1 mb-1.5">
          <Keyboard size={9} className="text-primary/70" strokeWidth={2} />
          <span className="text-[9px] font-heading font-bold text-muted-foreground uppercase tracking-wider">Shortcuts</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {shortcuts.map(({ keys, action }) => (
            <div key={keys} className="flex items-center gap-1">
              <kbd className="text-[8px] font-mono bg-secondary px-1 py-0.5 rounded border border-border/40 text-foreground/60">{keys}</kbd>
              <span className="text-[9px] text-foreground/60">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-lg border border-primary/15 bg-primary/[0.03] px-2.5 py-1.5 flex items-center gap-2" data-testid="privacy-disclaimer">
        <ShieldCheck size={11} className="text-primary shrink-0" strokeWidth={2} />
        <p className="text-[9px] text-muted-foreground/80 leading-snug">
          <span className="font-semibold text-primary">100% Private</span> — Runs entirely in your browser. No data leaves your machine.
        </p>
      </div>

      {/* Feedback */}
      <button
        onClick={handleFeedback}
        className="cursor-pointer w-full flex items-center justify-center gap-1.5 h-7 text-[10px] font-heading font-semibold
          rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        data-testid="feedback-email-btn"
      >
        <Mail size={11} strokeWidth={1.5} />
        Send Feedback
      </button>
    </div>
  );
}
