import { useState } from 'react';
import { Save, Trash2, RotateCcw, Clock, Monitor, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function SessionManager({ sessions, onSave, onDelete, onRestore, windows }) {
  const [name, setName] = useState('');

  const handleSave = () => {
    const sessionName = name.trim() || `Session ${new Date().toLocaleDateString()}`;
    onSave(sessionName, windows);
    setName('');
    toast.success(`Session "${sessionName}" saved`);
  };

  return (
    <div className="p-2 space-y-3" data-testid="session-manager">
      <div className="flex items-center gap-1.5 mb-1">
        <Save size={13} className="text-primary" strokeWidth={1.5} />
        <span className="text-xs font-heading font-bold">Sessions</span>
      </div>

      {/* Contextual help */}
      <div className="px-2.5 py-2 rounded-lg bg-primary/[0.04] border border-primary/10 text-[11px] text-muted-foreground leading-relaxed mb-2" data-testid="session-help">
        Snapshot all your current windows and tabs. Restore a session later to reopen everything exactly as it was — like bookmarking your entire browser state.
      </div>

      <div className="flex gap-1.5">
        <input
          data-testid="session-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Session name..."
          className="flex-1 h-7 px-2 text-xs bg-secondary border-none rounded-md
            ring-1 ring-white/10 focus:ring-primary focus:outline-none
            placeholder:text-muted-foreground text-foreground font-body"
        />
        <button
          data-testid="save-session-btn"
          onClick={handleSave}
          className="h-7 px-3 text-[11px] font-heading font-semibold rounded-md
            bg-primary text-primary-foreground hover:bg-primary/90
            shadow-[0_0_10px_rgba(76,201,240,0.2)] transition-all active:scale-95"
        >
          Save
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-[11px] text-muted-foreground text-center py-4 font-body">
          No saved sessions yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {sessions.map(session => (
            <div
              key={session.id}
              className="bg-card border border-border/50 rounded-md p-2 hover:border-primary/30 transition-colors"
              data-testid={`session-card-${session.id}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-heading font-semibold truncate">{session.name}</span>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                  <Clock size={9} strokeWidth={1.5} />
                  {new Date(session.savedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1.5">
                <span className="flex items-center gap-0.5">
                  <Monitor size={9} strokeWidth={1.5} /> {session.windowCount}
                </span>
                <span className="flex items-center gap-0.5">
                  <FileText size={9} strokeWidth={1.5} /> {session.tabCount}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  data-testid={`restore-session-${session.id}`}
                  onClick={() => { onRestore(session); toast.success(`Restored "${session.name}"`); }}
                  className="flex-1 h-6 text-[10px] font-heading font-semibold rounded
                    bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw size={10} strokeWidth={1.5} /> Restore
                </button>
                <button
                  data-testid={`delete-session-${session.id}`}
                  onClick={() => { onDelete(session.id); toast.success('Session deleted'); }}
                  className="h-6 px-2 text-[10px] rounded text-muted-foreground
                    hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={10} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
