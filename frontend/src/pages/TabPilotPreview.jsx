import { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/tabpilot/Sidebar';
import { Toaster } from '@/components/ui/sonner';

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

      {/* Resize handle — subtle, appears on hover */}
      <div
        data-testid="sidebar-resize-handle"
        onMouseDown={handleMouseDown}
        className="w-[5px] shrink-0 cursor-col-resize relative group"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-primary/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full
          bg-border/40 group-hover:bg-primary/60 transition-colors duration-150" />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto bg-card/30">
        <div className="max-w-2xl mx-auto px-8 py-12">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-heading font-black text-primary">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-heading font-black tracking-tight">
                  <span className="text-foreground">Tab</span><span className="text-primary">Pilot</span>
                </h1>
                <p className="text-[11px] text-muted-foreground font-mono">Chrome Tab & Window Manager</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-md">
              Master your tabs. The sidebar on the left is fully interactive — try searching,
              right-clicking, dragging tabs, opening the heatmap, or pressing <kbd className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono">Cmd+K</kbd> for quick switch.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-12">
            {[
              'Tab tree view', 'Fuzzy search', 'Domain grouping', 'Duplicate detection',
              'Drag & drop', 'Session manager', 'Activity heatmap', 'Focus mode',
              'Tab suspension', 'Tab groups', 'Tab notes', 'Smart workspaces',
              'Command palette', 'Context menus', 'Keyboard shortcuts', 'Auto-close rules',
            ].map(f => (
              <div key={f} className="text-[11px] font-body text-muted-foreground py-1.5 px-3 rounded-md bg-card border border-border/40">
                {f}
              </div>
            ))}
          </div>

          <div className="space-y-1.5 mb-12">
            <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">Shortcuts</span>
            {[
              ['Cmd+K', 'Quick switch'],
              ['Ctrl+Shift+F', 'Focus search'],
              ['Arrow keys', 'Navigate'],
              ['Enter', 'Switch to tab'],
              ['Delete', 'Close tab'],
            ].map(([key, action]) => (
              <div key={key} className="flex items-center justify-between py-1 px-3 rounded-md bg-card border border-border/40">
                <span className="text-[11px] text-muted-foreground font-body">{action}</span>
                <kbd className="text-[9px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground/70">{key}</kbd>
              </div>
            ))}
          </div>

          <div className="text-center pt-6 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground/50 font-mono">
              Manifest V3 | React 18 | Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
