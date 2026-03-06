import { Code, Video, Search, Coffee } from 'lucide-react';
import { WORKSPACE_PRESETS } from '@/utils/mockData';
import { getFaviconUrl } from '@/utils/grouping';
import { toast } from 'sonner';

const ICONS = { code: Code, video: Video, search: Search, coffee: Coffee };

export function WorkspaceManager({ allTabs, onSwitch }) {
  const handleActivate = (workspace) => {
    workspace.tabIds.forEach(id => {
      const tab = allTabs.find(t => t.id === id);
      if (tab) onSwitch(tab.id);
    });
    toast.success(`Workspace "${workspace.name}" activated`);
  };

  return (
    <div className="p-3 space-y-3" data-testid="workspace-manager">
      <div className="flex items-center gap-1.5">
        <Code size={13} className="text-primary" strokeWidth={1.5} />
        <span className="text-xs font-heading font-bold">Smart Workspaces</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        One-click context switching. Activate a workspace to focus on the right tabs.
      </p>

      <div className="space-y-1.5">
        {WORKSPACE_PRESETS.map(ws => {
          const Icon = ICONS[ws.icon] || Code;
          const matchedTabs = ws.tabIds.map(id => allTabs.find(t => t.id === id)).filter(Boolean);
          return (
            <div
              key={ws.id}
              className="p-2.5 rounded-lg bg-card border border-border/30 hover:border-primary/20 transition-colors"
              data-testid={`workspace-${ws.id}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: ws.color + '20' }}
                >
                  <Icon size={12} style={{ color: ws.color }} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-heading font-bold">{ws.name}</div>
                  <div className="text-[9px] text-muted-foreground/60">{ws.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {matchedTabs.slice(0, 5).map(tab => (
                  <img
                    key={tab.id}
                    src={getFaviconUrl(tab.url)}
                    alt=""
                    className="w-3.5 h-3.5 rounded-[2px]"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
                {matchedTabs.length > 5 && (
                  <span className="text-[8px] text-muted-foreground font-mono">+{matchedTabs.length - 5}</span>
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
