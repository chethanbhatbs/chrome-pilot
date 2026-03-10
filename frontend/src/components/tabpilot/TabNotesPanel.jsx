import { useState } from 'react';
import { StickyNote, X, Save } from 'lucide-react';
import { getFaviconUrl, getDomain, handleFaviconError } from '@/utils/grouping';
import { toast } from 'sonner';

export function TabNotesPanel({ allTabs, tabNotes, onSetNote, onSwitch }) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [editText, setEditText] = useState('');

  const tabsWithNotes = allTabs.filter(t => tabNotes[t.id]);

  const startEdit = (tabId) => {
    setEditingTabId(tabId);
    setEditText(tabNotes[tabId] || '');
  };

  const saveNote = () => {
    if (editingTabId !== null) {
      onSetNote(editingTabId, editText);
      setEditingTabId(null);
      setEditText('');
      toast.success('Note saved');
    }
  };

  const deleteNote = (tabId) => {
    onSetNote(tabId, '');
    toast.success('Note removed');
  };

  return (
    <div className="p-3 space-y-3" data-testid="tab-notes-panel">
      <div className="flex items-center gap-1.5">
        <StickyNote size={13} className="text-primary" strokeWidth={1.5} />
        <span className="text-xs font-heading font-bold">Tab Notes</span>
        <span className="text-[9px] text-muted-foreground/50 font-mono ml-auto">{tabsWithNotes.length}</span>
      </div>

      {editingTabId !== null && (
        <div className="p-2 rounded-lg bg-card border border-border/50 space-y-2" data-testid="note-editor">
          <textarea
            data-testid="note-editor-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Write a note for this tab..."
            rows={3}
            className="w-full px-2 py-1.5 text-[11px] font-body bg-background border border-border rounded-md
              text-foreground placeholder:text-muted-foreground/40 resize-none
              focus:outline-none focus:ring-1 focus:ring-primary/40"
            autoFocus
          />
          <div className="flex gap-1">
            <button
              data-testid="note-save-btn"
              onClick={saveNote}
              className="flex-1 h-6 flex items-center justify-center gap-1 text-[10px] font-heading font-semibold
                rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Save size={10} strokeWidth={1.5} /> Save
            </button>
            <button
              onClick={() => setEditingTabId(null)}
              className="h-6 px-2 text-[10px] rounded-md text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--hover-medium))] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tabsWithNotes.length === 0 && editingTabId === null ? (
        <div className="text-[11px] text-muted-foreground/60 text-center py-4 font-body">
          No notes yet. Right-click any tab to add a note.
        </div>
      ) : (
        <div className="space-y-1">
          {tabsWithNotes.map(tab => (
            <div
              key={tab.id}
              className="p-2 rounded-lg bg-card border border-border/30 hover:border-primary/20 transition-colors"
              data-testid={`tab-note-${tab.id}`}
            >
              <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => onSwitch(tab.id)}>
                <img src={getFaviconUrl(tab.url, tab.favIconUrl)} alt="" className="w-3.5 h-3.5 rounded-[2px] shrink-0" data-tab-url={tab.url} data-chrome-favicon={tab.favIconUrl || ''} onError={handleFaviconError} />
                <span className="text-[10px] font-body truncate flex-1 text-foreground/80">{tab.title}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5 pl-5.5">{tabNotes[tab.id]}</p>
              <div className="flex gap-1 pl-5.5">
                <button
                  onClick={() => startEdit(tab.id)}
                  className="text-[9px] text-primary hover:text-primary/80 font-body transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteNote(tab.id)}
                  className="text-[9px] text-muted-foreground hover:text-destructive font-body transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
