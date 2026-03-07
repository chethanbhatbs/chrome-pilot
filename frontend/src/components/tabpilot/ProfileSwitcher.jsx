import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowRightLeft, RefreshCw, Check, ChevronUp, UserPlus, Users, FileText, Volume2, Pause, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  isExtensionContext, chromeNativeHostPing, chromeGetProfiles, chromeSwitchProfile,
  chromeStorageGet, chromeStorageSet, chromeCreateProfile
} from '@/utils/chromeAdapter';

const AVATAR_COLORS = [
  '#8ab4f8', '#81c995', '#f28b82', '#fdd663', '#c58af9',
  '#78d9ec', '#fcad70', '#ff8bcb', '#a8dab5', '#b4a7d6',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ProfileSwitcher({ onOpenSetup, allTabs = [], suspendedCount = 0 }) {
  const [profiles, setProfiles] = useState([]);
  const [hostAvailable, setHostAvailable] = useState(null);
  const [switching, setSwitching] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [needsSelection, setNeedsSelection] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hiddenProfiles, setHiddenProfiles] = useState([]);

  const tabCount = allTabs.length;
  const audibleCount = useMemo(() => allTabs.filter(t => t.audible && !t.mutedInfo?.muted).length, [allTabs]);
  const dupCount = useMemo(() => {
    const urlMap = {};
    let d = 0;
    allTabs.forEach(t => {
      if (!t.url) return;
      let n;
      if (t.url.startsWith('chrome://') || t.url.startsWith('chrome-extension://')) {
        n = t.url.replace(/\/$/, '');
      } else {
        try { const u = new URL(t.url); n = u.origin + u.pathname.replace(/\/$/, '') + u.search; }
        catch { return; }
      }
      if (urlMap[n]) d++;
      else urlMap[n] = true;
    });
    return d;
  }, [allTabs]);

  const loadProfiles = useCallback(async () => {
    if (!isExtensionContext()) {
      setHostAvailable(true);
      setProfiles([
        { directory: 'Default', name: 'Personal', userName: 'user@gmail.com', picture: null },
        { directory: 'Profile 1', name: 'Work', userName: 'user@company.com', picture: null },
        { directory: 'Profile 2', name: 'Dev', userName: '', picture: null },
      ]);
      setCurrentProfile('Default');
      return;
    }

    const cached = await chromeStorageGet(['tabpilot_my_profile', 'tabpilot_profile_verified', 'tabpilot_hidden_profiles']);
    setHiddenProfiles(cached?.tabpilot_hidden_profiles || []);
    if (cached?.tabpilot_my_profile && cached?.tabpilot_profile_verified) {
      // Only trust cached profile if user explicitly verified it
      setCurrentProfile(cached.tabpilot_my_profile);
    } else if (cached?.tabpilot_my_profile && !cached?.tabpilot_profile_verified) {
      // Old auto-detected value — don't trust it, force re-selection
      setCurrentProfile(null);
    }

    const pingResult = await chromeNativeHostPing();
    if (!pingResult || pingResult.error) {
      setHostAvailable(false);
      return;
    }
    setHostAvailable(true);

    const result = await chromeGetProfiles();
    if (result?.profiles) {
      setProfiles(result.profiles);

      if (cached?.tabpilot_my_profile && cached?.tabpilot_profile_verified) {
        // Verified cached value — check it still exists in profile list
        const exists = result.profiles.some(p => p.directory === cached.tabpilot_my_profile);
        if (!exists) {
          // Cached profile was deleted — need re-selection
          setCurrentProfile(null);
          setNeedsSelection(true);
        }
      } else {
        // No cached value — NEVER auto-detect (unreliable for multi-profile)
        if (result.profiles.length === 1) {
          // Only one profile, no ambiguity — auto-select and mark verified
          setCurrentProfile(result.profiles[0].directory);
          chromeStorageSet({ tabpilot_my_profile: result.profiles[0].directory, tabpilot_profile_verified: true });
        } else {
          // Multiple profiles — always ask user to identify themselves
          setNeedsSelection(true);
        }
      }
    }
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  // Re-read hidden profiles when dropdown opens (ProfilePanel may have updated storage)
  useEffect(() => {
    if (!open || !isExtensionContext()) return;
    chromeStorageGet(['tabpilot_hidden_profiles']).then(data => {
      setHiddenProfiles(data?.tabpilot_hidden_profiles || []);
    });
  }, [open]);

  const handleSelectMyProfile = useCallback((directory) => {
    setCurrentProfile(directory);
    chromeStorageSet({ tabpilot_my_profile: directory, tabpilot_profile_verified: true });
    setNeedsSelection(false);
    setOpen(false);
    const p = profiles.find(pr => pr.directory === directory);
    toast.success(`Profile set to "${p?.name || directory}"`);
  }, [profiles]);

  const handleSwitch = useCallback(async (profileDirectory, profileName) => {
    if (switching) return;
    setSwitching(profileDirectory);
    const result = await chromeSwitchProfile(profileDirectory, 'https://github.com/chethan-sudo/chrome-pilot');
    if (result?.success) {
      toast.success(`Opening "${profileName}" — check GitHub for install instructions`);
    } else {
      toast.error(result?.error || 'Failed to switch profile');
    }
    setSwitching(null);
    setOpen(false);
  }, [switching]);

  const handleCreateProfile = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    const result = await chromeCreateProfile();
    if (result?.success) {
      toast.success('New profile created — set it up in Chrome');
      setTimeout(() => loadProfiles(), 2000);
    } else {
      toast.error(result?.error || 'Failed to create profile');
    }
    setCreating(false);
    setOpen(false);
  }, [creating, loadProfiles]);

  const handleManageProfiles = useCallback(() => {
    setOpen(false);
    onOpenSetup?.();
  }, [onOpenSetup]);

  const current = profiles.find(p => p.directory === currentProfile);
  const others = profiles.filter(p => p.directory !== currentProfile && !hiddenProfiles.includes(p.directory));

  const stats = [
    { icon: FileText, label: 'Tabs', value: tabCount, color: 'text-primary', valColor: 'text-foreground' },
    { icon: Volume2, label: 'Playing audio', value: audibleCount, color: audibleCount > 0 ? 'text-emerald-500' : 'text-muted-foreground/50', valColor: audibleCount > 0 ? 'text-emerald-500' : 'text-muted-foreground/60' },
    { icon: Pause, label: 'Suspended', value: suspendedCount, color: suspendedCount > 0 ? 'text-amber-500' : 'text-muted-foreground/50', valColor: suspendedCount > 0 ? 'text-amber-500' : 'text-muted-foreground/60' },
    { icon: AlertTriangle, label: 'Duplicates', value: dupCount, color: dupCount > 0 ? 'text-rose-500' : 'text-muted-foreground/50', valColor: dupCount > 0 ? 'text-rose-500' : 'text-muted-foreground/60' },
  ];

  return (
    <div className="border-t border-primary/10 bg-primary/[0.03]" data-testid="profile-bottom-bar">
      <div className="flex items-center px-2.5 py-1.5">
        {/* Stats */}
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

        {/* Profile */}
        {hostAvailable === false ? (
          <button
            onClick={() => onOpenSetup?.()}
            className="cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded-md
              text-muted-foreground/60 hover:text-foreground hover:bg-[hsl(var(--hover-subtle))] transition-colors"
            title="Set up profile switching"
            data-testid="profile-setup-trigger"
          >
            <span className="text-[10px] font-body">Profiles</span>
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[8px] font-heading font-bold">P</span>
            </div>
          </button>
        ) : hostAvailable === true ? (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded-md
                  hover:bg-[hsl(var(--hover-subtle))] transition-colors"
                data-testid="profile-switcher-trigger"
                title={current ? `Profile: ${current.name}` : 'Select profile'}
              >
                <ChevronUp size={10} className="text-muted-foreground/40 shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-heading font-semibold truncate max-w-[90px]">
                  {needsSelection ? 'Select profile' : (current?.name || 'Profile')}
                </span>
                {current && !needsSelection ? (
                  <Avatar profile={current} size={18} />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary">?</span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="end" className="w-[240px] p-1.5" data-testid="profile-switcher-dropdown">
              {/* Profile selection prompt */}
              {needsSelection && (
                <>
                  <div className="px-2 py-1.5 text-[10px] font-heading font-semibold text-primary">
                    Which profile is this?
                  </div>
                  {profiles.map(profile => (
                    <button
                      key={profile.directory}
                      onClick={() => handleSelectMyProfile(profile.directory)}
                      className="cursor-pointer w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                        hover:bg-primary/10 transition-colors text-left"
                      data-testid={`profile-select-${profile.directory}`}
                    >
                      <Avatar profile={profile} size={24} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-heading font-semibold truncate block">{profile.name}</span>
                        {(profile.userName || profile.gaiaName) && (
                          <span className="text-[9px] text-muted-foreground/60 truncate block">{profile.userName || profile.gaiaName}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-primary font-heading font-semibold shrink-0">This is me</span>
                    </button>
                  ))}
                </>
              )}

              {/* Normal view: current + others */}
              {!needsSelection && (
                <>
                  {current && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/[0.06]">
                      <Avatar profile={current} size={26} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-heading font-semibold truncate">{current.name}</span>
                          <Check size={10} className="text-primary shrink-0" strokeWidth={2.5} />
                        </div>
                        {(current.userName || current.gaiaName) && (
                          <span className="text-[9px] text-muted-foreground/60 truncate block">{current.userName || current.gaiaName}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {others.length > 0 && <DropdownMenuSeparator className="my-1" />}

                  {others.map(profile => {
                    const isSwitching = switching === profile.directory;
                    return (
                      <button
                        key={profile.directory}
                        onClick={() => handleSwitch(profile.directory, profile.name)}
                        disabled={!!switching}
                        className="cursor-pointer w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                          hover:bg-[hsl(var(--hover-subtle))] transition-colors text-left
                          disabled:opacity-40 disabled:cursor-not-allowed"
                        data-testid={`profile-switch-${profile.directory}`}
                      >
                        <Avatar profile={profile} size={22} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-heading font-semibold truncate block">{profile.name}</span>
                          {(profile.userName || profile.gaiaName) && (
                            <span className="text-[8px] text-muted-foreground/50 truncate block">{profile.userName || profile.gaiaName}</span>
                          )}
                        </div>
                        <div className="shrink-0 text-primary/60">
                          {isSwitching ? (
                            <RefreshCw size={11} className="animate-spin" strokeWidth={1.5} />
                          ) : (
                            <ArrowRightLeft size={11} strokeWidth={1.5} />
                          )}
                        </div>
                      </button>
                    );
                  })}

                  <DropdownMenuSeparator className="my-1" />

                  {/* Create new profile */}
                  <button
                    onClick={handleCreateProfile}
                    disabled={creating}
                    className="cursor-pointer w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                      hover:bg-[hsl(var(--hover-subtle))] transition-colors text-left text-muted-foreground/70
                      disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="profile-create-btn"
                  >
                    {creating ? (
                      <RefreshCw size={11} strokeWidth={1.5} className="animate-spin" />
                    ) : (
                      <UserPlus size={11} strokeWidth={1.5} />
                    )}
                    <span className="text-[10px] font-body">Create new profile</span>
                  </button>

                  {/* Manage profiles — opens sidebar panel */}
                  <button
                    onClick={handleManageProfiles}
                    className="cursor-pointer w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                      hover:bg-[hsl(var(--hover-subtle))] transition-colors text-left text-muted-foreground/70"
                    data-testid="profile-manage-btn"
                  >
                    <Users size={11} strokeWidth={1.5} />
                    <span className="text-[10px] font-body">Manage profiles</span>
                  </button>

                  {/* Change identity */}
                  <button
                    onClick={() => { setNeedsSelection(true); }}
                    className="cursor-pointer w-full flex items-center gap-2 px-2 py-1 rounded-md
                      hover:bg-[hsl(var(--hover-subtle))] transition-colors text-left text-muted-foreground/70"
                    data-testid="profile-reselect-btn"
                  >
                    <RefreshCw size={9} strokeWidth={1.5} />
                    <span className="text-[9px] font-body">Wrong profile? Re-select</span>
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ profile, size = 24 }) {
  const color = getAvatarColor(profile.name);
  const fontSize = size < 18 ? '7px' : size < 22 ? '8px' : size < 26 ? '9px' : '11px';

  if (profile.picture) {
    return (
      <img
        src={profile.picture}
        alt={profile.name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-heading font-bold text-white shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize }}
    >
      {profile.name.charAt(0).toUpperCase()}
    </div>
  );
}
