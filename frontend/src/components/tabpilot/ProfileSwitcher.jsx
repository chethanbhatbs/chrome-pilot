import { useMemo, useState, useEffect } from 'react';
import { FileText, Volume2, Pause, AlertTriangle, Settings, HelpCircle, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { normalizeUrl } from '@/utils/grouping';
import { isExtensionContext, chromeStorageGet, chromeGetProfiles } from '@/utils/chromeAdapter';

// Same avatar palette/logic as the Profiles panel, so the footer avatar matches.
const AVATAR_COLORS = ['#8ab4f8', '#81c995', '#f28b82', '#fdd663', '#c58af9', '#78d9ec', '#fcad70', '#ff8bcb', '#a8dab5', '#b4a7d6'];
function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Resolves the active Chrome profile for the footer avatar. Reads the cached
// meta first (instant); if it's missing but a verified profile exists, asks the
// native host once and caches the result. Stays null (→ generic icon) until set up.
function useActiveProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!isExtensionContext()) return;
    let cancelled = false;

    const resolve = async () => {
      const data = await chromeStorageGet(['tabpilot_active_profile', 'tabpilot_my_profile', 'tabpilot_profile_verified']);
      if (cancelled) return;
      if (data?.tabpilot_active_profile) { setProfile(data.tabpilot_active_profile); return; }
      if (data?.tabpilot_my_profile && data?.tabpilot_profile_verified) {
        const res = await chromeGetProfiles();
        if (cancelled) return;
        const p = res?.profiles?.find(pr => pr.directory === data.tabpilot_my_profile);
        if (p) setProfile({ directory: p.directory, name: p.name, userName: p.userName, picture: p.picture || null });
      }
    };
    resolve();

    if (!chrome?.storage?.onChanged) return;
    const handler = (changes) => { if (changes.tabpilot_active_profile) resolve(); };
    chrome.storage.onChanged.addListener(handler);
    return () => { cancelled = true; chrome.storage.onChanged.removeListener(handler); };
  }, []);
  return profile;
}

// Footer bar: live tab stats on the left, control cluster on the bottom-right.
// Profiles get a dedicated icon here (not buried under Settings) so switching
// Chrome profiles is one click; Settings stays alongside it.
export function ProfileSwitcher({ onOpenSettings, onOpenHelp, onOpenProfiles, allTabs = [], suspendedCount = 0, dupCount: dupCountProp }) {
  const activeProfile = useActiveProfile();
  const tabCount = allTabs.length;
  const audibleCount = useMemo(
    () => allTabs.filter(t => t.audible && !t.mutedInfo?.muted).length,
    [allTabs]
  );
  const localDupCount = useMemo(() => {
    const urlMap = {};
    let d = 0;
    allTabs.forEach(t => {
      if (!t.url) return;
      const n = normalizeUrl(t.url);
      if (!n) return;
      if (urlMap[n]) d++;
      else urlMap[n] = true;
    });
    return d;
  }, [allTabs]);
  const dupCount = dupCountProp ?? localDupCount;

  const stats = [
    { icon: FileText, label: 'Tabs', value: tabCount, color: 'text-primary', valColor: 'text-foreground' },
    { icon: Volume2, label: 'Playing audio', value: audibleCount, color: audibleCount > 0 ? 'text-emerald-500' : 'text-muted-foreground/50', valColor: audibleCount > 0 ? 'text-emerald-500' : 'text-muted-foreground/60' },
    { icon: Pause, label: 'Suspended', value: suspendedCount, color: suspendedCount > 0 ? 'text-amber-500' : 'text-muted-foreground/50', valColor: suspendedCount > 0 ? 'text-amber-500' : 'text-muted-foreground/60' },
    { icon: AlertTriangle, label: 'Duplicates', value: dupCount, color: dupCount > 0 ? 'text-rose-500' : 'text-muted-foreground/50', valColor: dupCount > 0 ? 'text-rose-500' : 'text-muted-foreground/60' },
  ];

  return (
    <div className="border-t border-border bg-background" data-testid="profile-bottom-bar">
      <div className="flex items-center px-2.5 py-1.5">
        {/* Always show all four — keeps the home footer consistent with the
            Focus-mode footer (which shows them all), so stats don't appear/vanish. */}
        <div className="flex items-center gap-3 flex-1" data-testid="stats-bar">
          {stats.map(({ icon: Icon, label, value, color, valColor }, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-default">
                  <Icon size={11} strokeWidth={1.8} className={color} />
                  <span className={`text-[11px] tabular-nums font-mono font-semibold ${valColor}`}>{value}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] font-body">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Help → Settings → Profiles, left to right. The crucial Profiles
            control sits in the bottom-right corner — the easiest pointer target
            (Fitts's law) — with Help (least used) furthest from it. */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenHelp}
                aria-label="Help"
                data-testid="footer-help-btn"
                className="cursor-pointer flex items-center justify-center w-7 h-7 rounded-md
                  text-foreground/50 hover:text-foreground hover:bg-[hsl(var(--hover-subtle))] transition-colors active:scale-95"
              >
                <HelpCircle size={15} strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-body">Help</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenSettings}
                aria-label="Settings"
                data-testid="footer-settings-btn"
                className="cursor-pointer flex items-center justify-center w-7 h-7 rounded-md
                  text-foreground/50 hover:text-foreground hover:bg-[hsl(var(--hover-subtle))] transition-colors active:scale-95"
              >
                <Settings size={16} strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] font-body">Settings</TooltipContent>
          </Tooltip>
          {onOpenProfiles && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onOpenProfiles}
                  aria-label={activeProfile ? `Profile: ${activeProfile.name}` : 'Switch profile'}
                  data-testid="footer-profiles-btn"
                  className="cursor-pointer flex items-center justify-center w-7 h-7 rounded-md
                    text-foreground/50 hover:text-foreground hover:bg-[hsl(var(--hover-subtle))] transition-colors active:scale-95"
                >
                  {activeProfile ? (
                    activeProfile.picture ? (
                      <img src={activeProfile.picture} alt="" className="w-[18px] h-[18px] rounded-full object-cover ring-1 ring-border/50" />
                    ) : (
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-black/70 ring-1 ring-border/50"
                        style={{ background: avatarColor(activeProfile.name) }}
                      >
                        {(activeProfile.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )
                  ) : (
                    <Users size={15} strokeWidth={1.8} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] font-body">
                {activeProfile ? `${activeProfile.name} · switch profile` : 'Profiles & windows'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
