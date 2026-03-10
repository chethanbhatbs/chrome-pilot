import { useState } from 'react';
import { Save, Trash2, RotateCcw, Clock, Monitor, FileText, ChevronRight, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { getFaviconUrl, handleFaviconError } from '@/utils/grouping';

export function SessionManager({ sessions, onSave, onDelete, onRestore, windows }) {
  const [name, setName] = useState('');
  const [expandedSession, setExpandedSession] = useState(null);

  const handleSave = () => {
    const sessionName = name.trim() || `Session ${new Date().toLocaleDateString()}`;
    // Prevent duplicate session names
    if (sessions.some(s => s.name.toLowerCase() === sessionName.toLowerCase())) {
      toast.error(`Session "${sessionName}" already exists`);
      return;
    }
    onSave(sessionName, windows);
    setName('');
    toast.success(`Session "${sessionName}" saved`);
  };

  return (
    <div className="p-3 space-y-3" data-testid="session-manager">
      <div className="flex items-center gap-1.5 mb-1">
        <Save size={13} className="text-primary" strokeWidth={1.5} />
        <span className="text-xs font-heading font-bold">Sessions</span>
      </div>

      {/* Contextual help */}
      <div className="px-2.5 py-2 rounded-lg bg-primary/[0.04] border border-primary/10 text-[11px] text-muted-foreground/80 leading-relaxed mb-2" data-testid="session-help">
        Snapshot all your current windows and tabs. Restore a session later to reopen everything exactly as it was.
      </div>

      <div className="flex gap-1.5">
        <input
          data-testid="session-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Session name..."
          className="flex-1 h-7 px-2 text-xs bg-secondary rounded-md
            border border-border/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 focus:outline-none
            placeholder:text-muted-foreground/60 text-foreground font-body"
        />
        <button
          data-testid="save-session-btn"
          onClick={handleSave}
          className="cursor-pointer h-7 px-3 text-[11px] font-heading font-semibold rounded-md
            bg-primary text-primary-foreground hover:bg-primary/90
            shadow-[0_0_10px_hsl(var(--primary)/0.25)] transition-all active:scale-95"
        >
          Save
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-[11px] text-muted-foreground/70 text-center py-4 font-body">
          No saved sessions yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {sessions.map(session => {
            const isExpanded = expandedSession === session.id;
            const allSessionTabs = session.windows?.flatMap(w => w.tabs) || [];
            return (
              <div
                key={session.id}
                className="bg-card border border-border/40 rounded-md p-2 hover:border-primary/30 transition-colors"
                data-testid={`session-card-${session.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-heading font-semibold truncate">{session.name}</span>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground/70 font-mono">
                    <Clock size={9} strokeWidth={1.5} />
                    {new Date(session.savedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 mb-1.5">
                  <span className="flex items-center gap-0.5">
                    <Monitor size={9} strokeWidth={1.5} /> {session.windowCount} window{session.windowCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <FileText size={9} strokeWidth={1.5} /> {session.tabCount} tab{session.tabCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Expandable tab list */}
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  className="cursor-pointer flex items-center gap-1 text-[9px] text-primary/70 hover:text-primary transition-colors mb-1.5 w-full"
                  data-testid={`session-expand-${session.id}`}
                >
                  <ChevronRight size={9} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} strokeWidth={2} />
                  {isExpanded ? 'Hide tabs' : 'View tabs'}
                </button>

                {isExpanded && allSessionTabs.length > 0 && (
                  <div className="mb-2 space-y-0.5 max-h-[150px] overflow-y-auto rounded border border-border/30 bg-background/50 p-1">
                    {allSessionTabs.map((tab, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] text-foreground/70 hover:bg-[hsl(var(--hover-subtle))]">
                        <img src={getFaviconUrl(tab.url, tab.favIconUrl)} alt="" className="w-3 h-3 rounded-[2px] shrink-0" data-tab-url={tab.url} data-chrome-favicon={tab.favIconUrl || ''} onError={handleFaviconError} />
                        <span className="truncate flex-1">{tab.title}</span>
                        {tab.pinned && <span className="text-[7px] text-primary/60 font-mono shrink-0">PIN</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    data-testid={`restore-session-${session.id}`}
                    onClick={() => onRestore(session)}
                    className="cursor-pointer flex-1 h-6 text-[10px] font-heading font-semibold rounded
                      bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={10} strokeWidth={1.5} /> Restore
                  </button>
                  <button
                    data-testid={`delete-session-${session.id}`}
                    onClick={() => { onDelete(session.id); toast.success('Session deleted'); }}
                    className="cursor-pointer h-6 px-2 text-[10px] rounded text-muted-foreground/60
                      hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={10} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
