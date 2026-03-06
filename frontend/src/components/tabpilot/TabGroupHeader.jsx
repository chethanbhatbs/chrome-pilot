import { TAB_GROUP_COLORS } from '@/utils/mockData';
import { ChevronRight } from 'lucide-react';

export function TabGroupHeader({ group, collapsed, onToggle }) {
  const color = TAB_GROUP_COLORS[group.color] || TAB_GROUP_COLORS.grey;

  return (
    <button
      data-testid={`tab-group-header-${group.id}`}
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] font-heading font-semibold
        rounded-md transition-colors hover:bg-white/5 cursor-pointer"
      style={{ borderLeft: `3px solid ${color.bg}` }}
    >
      <ChevronRight
        size={11}
        className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}
        strokeWidth={2}
        style={{ color: color.bg }}
      />
      <div
        className="h-2.5 w-2.5 rounded-sm shrink-0"
        style={{ backgroundColor: color.bg }}
      />
      <span style={{ color: color.bg }}>{group.title}</span>
      {collapsed && (
        <span className="text-[9px] text-muted-foreground/50 font-mono ml-auto">collapsed</span>
      )}
    </button>
  );
}
