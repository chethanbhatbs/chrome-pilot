import { TAB_GROUP_COLORS } from '@/utils/mockData';
import { ChevronRight } from 'lucide-react';

export function TabGroupHeader({ group, collapsed, onToggle }) {
  const color = TAB_GROUP_COLORS[group.color] || TAB_GROUP_COLORS.grey;

  return (
    <button
      data-testid={`tab-group-header-${group.id}`}
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full px-2.5 py-1 text-[10.5px] font-heading font-semibold
        rounded-[4px] transition-colors hover:bg-white/[0.04] cursor-pointer"
    >
      <ChevronRight
        size={10}
        className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}
        strokeWidth={2}
        style={{ color: color.bg }}
      />
      <div
        className="h-2 w-2 rounded-[2px] shrink-0"
        style={{ backgroundColor: color.bg }}
      />
      <span style={{ color: color.bg }}>{group.title}</span>
    </button>
  );
}
