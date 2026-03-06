import { TAB_GROUP_COLORS } from '@/utils/mockData';
import { ChevronRight } from 'lucide-react';

export function TabGroupHeader({ group, collapsed, onToggle }) {
  const color = TAB_GROUP_COLORS[group.color] || TAB_GROUP_COLORS.grey;

  return (
    <button
      data-testid={`tab-group-header-${group.id}`}
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full px-1.5 py-0.5 text-[9px] font-heading font-semibold tracking-tight
        transition-colors hover:bg-white/[0.03] cursor-pointer"
    >
      <div
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color.bg }}
      />
      <span className="opacity-70" style={{ color: color.bg }}>{group.title}</span>
      <ChevronRight
        size={9}
        className={`transition-transform duration-200 opacity-50 ${collapsed ? '' : 'rotate-90'}`}
        strokeWidth={2}
        style={{ color: color.bg }}
      />
      {collapsed && (
        <span className="text-[8px] text-muted-foreground/30 font-mono font-normal normal-case tracking-normal ml-auto">
          collapsed
        </span>
      )}
    </button>
  );
}
