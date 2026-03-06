import { useState, useEffect, useCallback } from 'react';
import { Timer, Shield, Trash2, Plus, X, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getDomain, getFaviconUrl } from '@/utils/grouping';

const PRESETS = [
  { id: '15', label: '15 min', minutes: 15 },
  { id: '30', label: '30 min', minutes: 30 },
  { id: '60', label: '1 hour', minutes: 60 },
  { id: '120', label: '2 hours', minutes: 120 },
  { id: 'off', label: 'Off', minutes: 0 },
];

export function AutoClosePanel({ allTabs, onClose }) {
  const [enabled, setEnabled] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('30');
  const [customMinutes, setCustomMinutes] = useState('');
  const [whitelist, setWhitelist] = useState(['mail.google.com', 'docs.google.com']);
  const [newDomain, setNewDomain] = useState('');
  const [tabTimers, setTabTimers] = useState({});

  const activeMinutes = selectedPreset === 'custom'
    ? parseInt(customMinutes) || 0
    : PRESETS.find(p => p.id === selectedPreset)?.minutes || 0;

  // Simulate tab timers when enabled
  useEffect(() => {
    if (!enabled || activeMinutes === 0) {
      setTabTimers({});
      return;
    }
    const timers = {};
    allTabs.forEach(tab => {
      if (tab.active || tab.pinned) return;
      const domain = getDomain(tab.url);
      if (whitelist.includes(domain)) return;
      // Simulate random remaining time
      timers[tab.id] = Math.floor(Math.random() * activeMinutes);
    });
    setTabTimers(timers);
  }, [enabled, activeMinutes, allTabs, whitelist]);

  const handleToggle = useCallback((val) => {
    setEnabled(val);
    if (val) toast.success(`Auto-close enabled: ${activeMinutes}min inactivity`);
    else toast.info('Auto-close disabled');
  }, [activeMinutes]);

  const addWhitelistDomain = useCallback(() => {
    const d = newDomain.trim().toLowerCase();
    if (!d) return;
    if (whitelist.includes(d)) { toast.info('Already whitelisted'); return; }
    setWhitelist(prev => [...prev, d]);
    setNewDomain('');
    toast.success(`${d} whitelisted`);
  }, [newDomain, whitelist]);

  const removeWhitelistDomain = useCallback((domain) => {
    setWhitelist(prev => prev.filter(d => d !== domain));
  }, []);

  // Tabs that would be closed
  const atRiskTabs = allTabs.filter(tab => {
    if (!enabled || activeMinutes === 0) return false;
    if (tab.active || tab.pinned) return false;
    const domain = getDomain(tab.url);
    return !whitelist.includes(domain);
  });

  return (
    <div className="p-3 space-y-3" data-testid="auto-close-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={13} className="text-primary" strokeWidth={2} />
          <span className="text-xs font-heading font-bold">Auto-Close Rules</span>
        </div>
        <Switch
          data-testid="auto-close-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
          className="scale-75"
        />
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Automatically close tabs you haven't visited within a set time. Pinned, active, and whitelisted tabs are always safe.
      </p>

      {/* Inactivity timer presets */}
      <div>
        <span className="text-[9px] font-heading text-muted-foreground/50 uppercase tracking-wider">Inactivity Threshold</span>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {PRESETS.map(p => (
            <button
              key={p.id}
              data-testid={`auto-close-preset-${p.id}`}
              onClick={() => setSelectedPreset(p.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-body transition-all
                ${selectedPreset === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                }`}
            >
              {p.label}
            </button>
          ))}
          <button
            data-testid="auto-close-preset-custom"
            onClick={() => setSelectedPreset('custom')}
            className={`px-2 py-1 rounded-md text-[10px] font-body transition-all
              ${selectedPreset === 'custom'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
          >
            Custom
          </button>
        </div>
        {selectedPreset === 'custom' && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              data-testid="auto-close-custom-input"
              type="number"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Minutes"
              min={1}
              className="w-20 h-7 px-2 text-[10px] font-body bg-card border border-border rounded-md
                text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <span className="text-[10px] text-muted-foreground">minutes</span>
          </div>
        )}
      </div>

      {/* Whitelist */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Shield size={9} className="text-muted-foreground/50" strokeWidth={1.5} />
          <span className="text-[9px] font-heading text-muted-foreground/50 uppercase tracking-wider">Whitelisted Domains</span>
        </div>
        <p className="text-[9px] text-muted-foreground/40 mb-1.5">These domains will never be auto-closed.</p>
        <div className="space-y-0.5 mb-2">
          {whitelist.map(domain => (
            <div key={domain} className="flex items-center justify-between py-1 px-2 rounded-md bg-card/50 border border-border/30"
              data-testid={`whitelist-${domain}`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <img
                  src={getFaviconUrl(`https://${domain}`)}
                  alt=""
                  className="w-3.5 h-3.5 rounded-[2px] shrink-0"
                  onError={e => e.target.style.display = 'none'}
                />
                <span className="text-[10px] font-body text-foreground/70 truncate">{domain}</span>
              </div>
              <button
                onClick={() => removeWhitelistDomain(domain)}
                className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors shrink-0 ml-1"
              >
                <X size={10} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            data-testid="whitelist-input"
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addWhitelistDomain()}
            placeholder="Add domain (e.g., github.com)"
            className="flex-1 h-7 px-2 text-[10px] font-body bg-card border border-border rounded-md
              text-foreground placeholder:text-muted-foreground/40
              focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            data-testid="whitelist-add-btn"
            onClick={addWhitelistDomain}
            className="h-7 px-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* At-risk preview */}
      {enabled && activeMinutes > 0 && (
        <div className="rounded-lg border border-border/50 bg-card/50 p-2.5" data-testid="at-risk-tabs">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle size={10} className="text-foreground/60" strokeWidth={2} />
            <span className="text-[10px] font-heading font-semibold text-foreground/70">
              {atRiskTabs.length} tab{atRiskTabs.length !== 1 ? 's' : ''} subject to auto-close
            </span>
          </div>
          <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
            {atRiskTabs.slice(0, 8).map(tab => {
              const remaining = tabTimers[tab.id] || 0;
              return (
                <div key={tab.id} className="flex items-center gap-2 py-0.5 text-[10px]">
                  <span className="font-mono text-muted-foreground/50 w-10 text-right shrink-0">
                    {remaining}m
                  </span>
                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/50"
                      style={{ width: `${(remaining / activeMinutes) * 100}%` }}
                    />
                  </div>
                  <span className="truncate text-foreground/60 flex-1 max-w-[120px]">{tab.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
