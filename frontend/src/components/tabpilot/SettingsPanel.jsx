import { Settings, Sun, Moon, Laptop, Eye, EyeOff, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const themes = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Laptop, label: 'System' },
];

export function SettingsPanel({ settings, onUpdate }) {
  return (
    <div className="p-2 space-y-3" data-testid="settings-panel">
      <div className="flex items-center gap-1.5 mb-2">
        <Settings size={13} className="text-primary" strokeWidth={1.5} />
        <span className="text-xs font-heading font-bold">Settings</span>
      </div>

      <div>
        <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">Theme</span>
        <div className="flex gap-1 mt-1.5">
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              data-testid={`theme-${value}`}
              onClick={() => onUpdate('theme', value)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-body
                transition-all duration-150
                ${settings.theme === value
                  ? 'bg-primary text-primary-foreground shadow-[0_0_8px_rgba(76,201,240,0.2)]'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-white/10'
                }
              `}
            >
              <Icon size={12} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <Separator className="opacity-20" />

      <div className="space-y-2.5">
        <SettingToggle
          label="Show favicons"
          description="Display tab favicons"
          checked={settings.showFavicons}
          onChange={(v) => onUpdate('showFavicons', v)}
          testId="setting-favicons"
        />
        <SettingToggle
          label="Show URLs"
          description="Display domain below title"
          checked={settings.showUrls}
          onChange={(v) => onUpdate('showUrls', v)}
          testId="setting-urls"
        />
        <SettingToggle
          label="Compact mode"
          description="Reduce padding for density"
          checked={settings.compactMode}
          onChange={(v) => onUpdate('compactMode', v)}
          testId="setting-compact"
        />
        <SettingToggle
          label="Confirm close window"
          description="Ask before closing windows"
          checked={settings.confirmCloseWindow}
          onChange={(v) => onUpdate('confirmCloseWindow', v)}
          testId="setting-confirm-close"
        />
        <SettingToggle
          label="Auto-close duplicates"
          description="Close new duplicate tabs"
          checked={settings.autoCloseDuplicates}
          onChange={(v) => onUpdate('autoCloseDuplicates', v)}
          testId="setting-auto-dupes"
        />
      </div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange, testId }) {
  return (
    <div className="flex items-center justify-between" data-testid={testId}>
      <div>
        <div className="text-xs font-body font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-75" />
    </div>
  );
}
