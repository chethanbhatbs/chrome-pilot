import { useState, useCallback, useEffect } from 'react';
import {
  Code, Video, Search, Coffee, Briefcase, Plus, Pencil, Trash2, X, Check, Star
} from 'lucide-react';
import { WORKSPACE_PRESETS } from '@/utils/mockData';
import { getFaviconUrl, getDomain } from '@/utils/grouping';
import { toast } from 'sonner';

const ICON_OPTIONS = [
  { id: 'code', icon: Code, label: 'Code' },
  { id: 'video', icon: Video, label: 'Video' },
  { id: 'search', icon: Search, label: 'Research' },
  { id: 'coffee', icon: Coffee, label: 'Break' },
  { id: 'briefcase', icon: Briefcase, label: 'Work' },
  { id: 'star', icon: Star, label: 'Starred' },
];

const COLOR_OPTIONS = [
  '#8ab4f8', '#81c995', '#f28b82', '#fdd663', '#c58af9', '#78d9ec', '#fcad70', '#ff8bcb',
];

const ICONS = { code: Code, video: Video, search: Search, coffee: Coffee, briefcase: Briefcase, star: Star };

function loadCustomWorkspaces() {
  try {
    return JSON.parse(localStorage.getItem('tabpilot_workspaces') || '[]');
  } catch { return []; }
}

function saveCustomWorkspaces(workspaces) {
  localStorage.setItem('tabpilot_workspaces', JSON.stringify(workspaces));
}

export function WorkspaceManager({ allTabs, onSwitch }) {
  const [customWorkspaces, setCustomWorkspaces] = useState(loadCustomWorkspaces);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'code', color: '#8ab4f8', tabIds: [] });

  useEffect(() => {
    saveCustomWorkspaces(customWorkspaces);
  }, [customWorkspaces]);

  const allWorkspaces = [
    ...WORKSPACE_PRESETS.map(ws => ({ ...ws, isPreset: true })),
    ...customWorkspaces.map(ws => ({ ...ws, isPreset: false })),
  ];

  const handleActivate = (workspace) => {
    const tabIds = workspace.tabIds || [];
    tabIds.forEach(id => {
      const tab = allTabs.find(t => t.id === id);
      if (tab) onSwitch(tab.id);
    });
    toast.success(`Workspace "${workspace.name}" activated`);
  };

  const startCreate = () => {
    setForm({ name: '', icon: 'code', color: '#8ab4f8', tabIds: [] });
    setCreating(true);
    setEditing(null);
  };

  const startEdit = (ws) => {
    setForm({ name: ws.name, icon: ws.icon, color: ws.color, tabIds: [...ws.tabIds] });
    setEditing(ws.id);
    setCreating(true);
  };

  const toggleTab = (tabId) => {
    setForm(prev => ({
      ...prev,
      tabIds: prev.tabIds.includes(tabId)
        ? prev.tabIds.filter(id => id !== tabId)
        : [...prev.tabIds, tabId],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (form.tabIds.length === 0) { toast.error('Select at least one tab'); return; }

    if (editing) {
      setCustomWorkspaces(prev => prev.map(ws =>
        ws.id === editing ? { ...ws, ...form, description: form.tabIds.length + ' tabs' } : ws
      ));
      toast.success('Workspace updated');
    } else {
      const newWs = {
        id: `custom-${Date.now()}`,
        ...form,
        description: form.tabIds.length + ' tabs',
      };
      setCustomWorkspaces(prev => [...prev, newWs]);
      toast.success('Workspace created');
    }
    setCreating(false);
    setEditing(null);
  };

  const handleDelete = (wsId) => {
    setCustomWorkspaces(prev => prev.filter(ws => ws.id !== wsId));
    toast.success('Workspace deleted');
  };

  const cancelForm = () => {
    setCreating(false);
    setEditing(null);
  };

  return (
    <div className="p-3 space-y-3" data-testid="workspace-manager">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Briefcase size={13} className="text-primary" strokeWidth={1.5} />
          <span className="text-xs font-heading font-bold">Workspaces</span>
        </div>
        {!creating && (
          <button
            data-testid="create-workspace-btn"
            onClick={startCreate}
            className="flex items-center gap-1 h-6 px-2 text-[10px] font-heading font-semibold rounded-md
              bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={10} strokeWidth={2} /> New
          </button>
        )}
      </div>

      {/* Create/Edit form */}
      {creating && (
        <div className="rounded-lg border border-primary/30 bg-card p-3 space-y-2.5" data-testid="workspace-form">
          <span className="text-[10px] font-heading font-bold text-primary">
            {editing ? 'Edit Workspace' : 'New Workspace'}
          </span>

          {/* Name */}
          <input
            data-testid="workspace-name-input"
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Workspace name"
            className="w-full h-7 px-2.5 text-[11px] font-body bg-background border border-border rounded-md
              text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />

          {/* Icon picker */}
          <div>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Icon</span>
            <div className="flex gap-1 mt-1">
              {ICON_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setForm(prev => ({ ...prev, icon: opt.id }))}
                    className={`p-1.5 rounded-md transition-colors
                      ${form.icon === opt.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:bg-white/[0.06]'}`}
                  >
                    <Icon size={12} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Color</span>
            <div className="flex gap-1.5 mt-1">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(prev => ({ ...prev, color: c }))}
                  className={`w-5 h-5 rounded-full transition-all
                    ${form.color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Tab picker */}
          <div>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
              Select Tabs ({form.tabIds.length})
            </span>
            <div className="mt-1 space-y-0.5 max-h-[150px] overflow-y-auto">
              {allTabs.map(tab => {
                const selected = form.tabIds.includes(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => toggleTab(tab.id)}
                    data-testid={`ws-tab-pick-${tab.id}`}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-colors
                      ${selected ? 'bg-primary/10 text-foreground' : 'hover:bg-white/[0.04] text-foreground/60'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors
                      ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                      {selected && <Check size={8} className="text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <img src={getFaviconUrl(tab.url)} alt="" className="w-3.5 h-3.5 rounded-[2px] shrink-0"
                      onError={e => e.target.style.display = 'none'} />
                    <span className="text-[10px] font-body truncate">{tab.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <button
              data-testid="workspace-save-btn"
              onClick={handleSave}
              className="flex-1 h-7 text-[10px] font-heading font-semibold rounded-md bg-primary text-primary-foreground
                hover:bg-primary/90 transition-colors"
            >
              {editing ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelForm}
              className="h-7 px-3 text-[10px] rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workspace list */}
      <div className="space-y-1.5">
        {allWorkspaces.map(ws => {
          const Icon = ICONS[ws.icon] || Code;
          const matchedTabs = (ws.tabIds || []).map(id => allTabs.find(t => t.id === id)).filter(Boolean);
          return (
            <div
              key={ws.id}
              className="p-2.5 rounded-lg bg-card border border-border/30 hover:border-primary/20 transition-colors"
              data-testid={`workspace-${ws.id}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: ws.color + '20' }}>
                  <Icon size={12} style={{ color: ws.color }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-heading font-bold truncate">{ws.name}</div>
                  <div className="text-[9px] text-muted-foreground/60 truncate">{ws.description}</div>
                </div>
                {!ws.isPreset && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => startEdit(ws)}
                      className="p-1 rounded text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors">
                      <Pencil size={10} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleDelete(ws.id)}
                      className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 size={10} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mb-2">
                {matchedTabs.slice(0, 5).map(tab => (
                  <img key={tab.id} src={getFaviconUrl(tab.url)} alt=""
                    className="w-3.5 h-3.5 rounded-[2px]" onError={e => e.target.style.display = 'none'} />
                ))}
                {matchedTabs.length > 5 && (
                  <span className="text-[8px] text-muted-foreground font-mono">+{matchedTabs.length - 5}</span>
                )}
                {matchedTabs.length === 0 && (
                  <span className="text-[8px] text-muted-foreground/40 italic">No matching tabs open</span>
                )}
              </div>
              <button
                data-testid={`activate-workspace-${ws.id}`}
                onClick={() => handleActivate(ws)}
                className="w-full h-6 text-[10px] font-heading font-semibold rounded-md
                  border border-border/50 text-foreground/70 hover:text-foreground hover:bg-white/[0.04] transition-colors"
              >
                Activate
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
