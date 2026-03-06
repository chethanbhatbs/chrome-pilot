import { TAB_GROUP_COLORS } from '@/utils/mockData';
import { ChevronRight } from 'lucide-react';

export function TabGroupHeader({ group, collapsed, onToggle }) {
  const color = TAB_GROUP_COLORS[group.color] || TAB_GROUP_COLORS.grey;

  return (
    <button
      data-testid={`tab-group-header-${group.id}`}
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] font-heading font-semibold
        rounded-sm transition-colors hover:bg-white/5 cursor-pointer"
      style={{ color: color.bg }}
    >
      <ChevronRight
        size={12}
        className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}
        strokeWidth={2}
      />
      <div
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color.bg }}
      />
      <span>{group.title}</span>
    </button>
  );
}
