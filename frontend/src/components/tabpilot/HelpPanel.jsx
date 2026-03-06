import { useState } from 'react';
import {
  HelpCircle, Keyboard, Mouse, Search, GripVertical, Save, Flame, Focus, Pause,
  LayoutGrid, Send, MessageSquare, ShieldCheck, ChevronRight, X
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const shortcuts = [
  ['Ctrl+Shift+E', 'Toggle sidebar'],
  ['Ctrl+Shift+F', 'Focus search'],
  ['Ctrl+Shift+D', 'Close duplicates'],
  ['Arrow Up/Down', 'Navigate tabs'],
  ['Enter', 'Switch to selected tab'],
  ['Delete / Backspace', 'Close selected tab'],
  ['Escape', 'Clear search'],
];

const tips = [
  { icon: Search, text: 'Use the search bar to fuzzy-search across all tab titles and URLs.' },
  { icon: Mouse, text: 'Right-click any tab for a full context menu: pin, mute, duplicate, move, suspend, and more.' },
  { icon: GripVertical, text: 'Drag & drop tabs to reorder them within a window, or drop onto another window.' },
  { icon: LayoutGrid, text: 'Toggle "Group by Domain" to see all your tabs organized by website instead of window.' },
  { icon: Save, text: 'Save your current set of tabs as a session. Restore them anytime to get back in the zone.' },
  { icon: Flame, text: 'The Activity Heatmap shows how much time you spend on each site — filter by day, week, or month.' },
  { icon: Focus, text: 'Focus Mode hides everything except your top workflow tabs to help you concentrate.' },
  { icon: Pause, text: 'Suspend inactive tabs to free up memory. Suspended tabs reload when you click them.' },
];

export function HelpPanel({ onBack }) {
  const [view, setView] = useState('help');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmitSuggestion = async () => {
    if (!message.trim()) { toast.error('Please enter a suggestion'); return; }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      if (res.ok) {
        toast.success('Thanks for your suggestion!');
        setName('');
        setMessage('');
      } else {
        toast.error('Failed to send. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 space-y-3" data-testid="help-panel">
      {/* Tab switcher */}
      <div className="flex gap-1 p-0.5 bg-secondary/50 rounded-lg">
        <button
          data-testid="help-tab-help"
          onClick={() => setView('help')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-body transition-all duration-150
            ${view === 'help'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <HelpCircle size={11} strokeWidth={1.5} />
          How to Use
        </button>
        <button
          data-testid="help-tab-suggest"
          onClick={() => setView('suggest')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-body transition-all duration-150
            ${view === 'suggest'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <MessageSquare size={11} strokeWidth={1.5} />
          Suggest
        </button>
      </div>

      {view === 'help' ? (
        <div className="space-y-4">
          {/* Tips */}
          <div>
            <span className="text-[9px] font-heading text-muted-foreground/50 uppercase tracking-wider">
              Quick Tips
            </span>
            <div className="mt-2 space-y-1">
              {tips.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-md hover:bg-card/60 transition-colors border-l-2 border-primary/20 pl-3">
                  <Icon size={12} className="text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[11px] text-foreground/70 font-body leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="opacity-20" />

          {/* Keyboard shortcuts */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Keyboard size={11} className="text-muted-foreground/60" strokeWidth={1.5} />
              <span className="text-[9px] font-heading text-muted-foreground/50 uppercase tracking-wider">
                Keyboard Shortcuts
              </span>
            </div>
            <div className="space-y-0.5">
              {shortcuts.map(([key, action]) => (
                <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-card/60 transition-colors">
                  <span className="text-[11px] text-foreground/60 font-body">{action}</span>
                  <kbd className="text-[9px] font-mono bg-secondary px-1.5 py-0.5 rounded border border-border/40 text-foreground/60 shrink-0 ml-2">{key}</kbd>
                </div>
              ))}
            </div>
          </div>

          <Separator className="opacity-20" />

          {/* Privacy */}
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3" data-testid="privacy-disclaimer">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldCheck size={12} className="text-primary" strokeWidth={2} />
              <span className="text-[11px] font-heading font-bold text-primary">Privacy Promise</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              TabPilot runs entirely in your browser. We <strong className="text-foreground">never</strong> collect,
              store, or transmit any browser data. Your data stays yours.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3" data-testid="suggestion-form">
          <div>
            <span className="text-[9px] font-heading text-muted-foreground/50 uppercase tracking-wider">
              Share your ideas
            </span>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Help make TabPilot better. We read every suggestion.
            </p>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Name (optional)</label>
            <input
              data-testid="suggestion-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-8 px-2.5 text-[11px] font-body bg-card border border-border rounded-md
                text-foreground placeholder:text-muted-foreground/40
                focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground font-body block mb-1">Suggestion <span className="text-tp-duplicate">*</span></label>
            <textarea
              data-testid="suggestion-message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to see improved?"
              rows={4}
              className="w-full px-2.5 py-2 text-[11px] font-body bg-card border border-border rounded-md
                text-foreground placeholder:text-muted-foreground/40 resize-none
                focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
            />
          </div>

          <button
            data-testid="suggestion-submit-btn"
            onClick={handleSubmitSuggestion}
            disabled={sending || !message.trim()}
            className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-heading font-semibold
              rounded-md bg-primary text-primary-foreground hover:bg-primary/90
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={11} strokeWidth={1.5} />
            {sending ? 'Sending...' : 'Submit Suggestion'}
          </button>
        </div>
      )}
    </div>
  );
}
