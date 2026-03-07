import { useState, useEffect, useCallback } from 'react';
import { Users, ArrowRightLeft, AlertTriangle, Terminal, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { isExtensionContext, chromeNativeHostPing, chromeGetProfiles, chromeSwitchProfile, chromeStorageGet, chromeStorageSet } from '@/utils/chromeAdapter';

const MOCK_PROFILES = [
  { directory: 'Default', name: 'Personal', userName: 'user@gmail.com' },
  { directory: 'Profile 1', name: 'Work', userName: 'user@company.com' },
  { directory: 'Profile 2', name: 'Dev', userName: '' },
];

export function ProfilePanel() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostAvailable, setHostAvailable] = useState(null);
  const [switching, setSwitching] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);

    if (!isExtensionContext()) {
      setHostAvailable(true);
      setProfiles(MOCK_PROFILES);
      setCurrentProfile('Default');
      setLoading(false);
      return;
    }

    const pingResult = await chromeNativeHostPing();
    if (!pingResult || pingResult.error) {
      setHostAvailable(false);
      setLoading(false);
      return;
    }
    setHostAvailable(true);

    const result = await chromeGetProfiles();
    if (result?.profiles) {
      setProfiles(result.profiles);
      // Detect current profile from storage
      const data = await chromeStorageGet(['tabpilot_current_profile']);
      if (data?.tabpilot_current_profile) {
        setCurrentProfile(data.tabpilot_current_profile);
      } else if (result.profiles.length > 0) {
        // Default heuristic: first profile
        setCurrentProfile(result.profiles[0].directory);
      }
    } else {
      toast.error(result?.error || 'Failed to load profiles');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwitch = useCallback(async (profileDirectory, profileName) => {
    if (switching) return;
    setSwitching(profileDirectory);
    const result = await chromeSwitchProfile(profileDirectory);
    if (result?.success) {
      toast.success(`Switching to "${profileName}"...`);
      if (isExtensionContext()) {
        chromeStorageSet({ tabpilot_current_profile: profileDirectory });
      }
    } else {
      toast.error(result?.error || 'Failed to switch profile');
    }
    setSwitching(null);
  }, [switching]);

  // Loading state
  if (loading) {
    return (
      <div className="p-3 space-y-3" data-testid="profile-panel">
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-primary" strokeWidth={1.5} />
          <span className="text-xs font-heading font-bold">Profiles</span>
        </div>
        <div className="text-[11px] text-muted-foreground/70 text-center py-6 font-body animate-pulse">
          Checking native host...
        </div>
      </div>
    );
  }

  // Setup required state
  if (!hostAvailable) {
    return (
      <div className="p-3 space-y-3" data-testid="profile-panel">
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-primary" strokeWidth={1.5} />
          <span className="text-xs font-heading font-bold">Profiles</span>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} className="text-amber-500" strokeWidth={2} />
            <span className="text-[11px] font-heading font-semibold text-amber-500">Setup Required</span>
          </div>
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
            Profile switching requires a native helper. Run this once in Terminal:
          </p>
          <div className="bg-secondary rounded-md p-2 font-mono text-[9px] text-foreground/80 leading-relaxed">
            <div className="flex items-center gap-1 mb-1.5 text-muted-foreground/50">
              <Terminal size={9} strokeWidth={2} />
              <span>Terminal</span>
            </div>
            <div className="select-all">
              cd chrome-pilot/native-host<br />
              bash install.sh
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
            The install script will ask for your extension ID (find it at <span className="font-mono text-foreground/70">chrome://extensions</span>).
            Restart Chrome after installing.
          </p>
          <button
            onClick={loadProfiles}
            className="cursor-pointer w-full h-6 text-[10px] font-heading font-semibold rounded
              bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
            data-testid="profile-retry-btn"
          >
            <RefreshCw size={10} strokeWidth={1.5} />
            I've installed it — Retry
          </button>
        </div>
      </div>
    );
  }

  // Profiles loaded state
  return (
    <div className="p-3 space-y-3" data-testid="profile-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-primary" strokeWidth={1.5} />
          <span className="text-xs font-heading font-bold">Profiles</span>
        </div>
        <button
          onClick={loadProfiles}
          className="cursor-pointer p-1 rounded-md text-muted-foreground/50 hover:text-foreground
            hover:bg-[hsl(var(--hover-medium))] transition-colors"
          data-testid="profile-refresh-btn"
        >
          <RefreshCw size={11} strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-2.5 py-2 rounded-lg bg-primary/[0.04] border border-primary/10 text-[11px]
        text-muted-foreground/80 leading-relaxed" data-testid="profile-help">
        Switch between Chrome profiles. Each profile has its own bookmarks, extensions, and history.
      </div>

      <div className="space-y-1.5">
        {profiles.map(profile => {
          const isCurrent = profile.directory === currentProfile;
          const isSwitching = switching === profile.directory;
          return (
            <div
              key={profile.directory}
              className={`bg-card border rounded-md p-2.5 transition-colors ${
                isCurrent
                  ? 'border-primary/40 bg-primary/[0.06]'
                  : 'border-border/40 hover:border-primary/30'
              }`}
              data-testid={`profile-card-${profile.directory}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-heading font-bold shrink-0
                  ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground/60'}`}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-heading font-semibold truncate">{profile.name}</span>
                    {isCurrent && (
                      <span className="text-[7px] font-mono font-bold bg-primary/20 text-primary px-1 py-0.5 rounded shrink-0 uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  {profile.userName && (
                    <span className="text-[9px] text-muted-foreground/60 truncate block">{profile.userName}</span>
                  )}
                  {!profile.userName && profile.gaiaName && (
                    <span className="text-[9px] text-muted-foreground/60 truncate block">{profile.gaiaName}</span>
                  )}
                  <span className="text-[8px] text-muted-foreground/40 font-mono">{profile.directory}</span>
                </div>
                {!isCurrent ? (
                  <button
                    onClick={() => handleSwitch(profile.directory, profile.name)}
                    disabled={!!switching}
                    className="cursor-pointer h-7 px-2.5 text-[10px] font-heading font-semibold rounded-md
                      bg-primary/10 text-primary hover:bg-primary/20 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed
                      flex items-center gap-1 shrink-0"
                    data-testid={`switch-profile-${profile.directory}`}
                  >
                    {isSwitching ? (
                      <RefreshCw size={10} className="animate-spin" strokeWidth={1.5} />
                    ) : (
                      <ArrowRightLeft size={10} strokeWidth={1.5} />
                    )}
                    Switch
                  </button>
                ) : (
                  <Check size={14} className="text-primary shrink-0" strokeWidth={2} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div className="text-[11px] text-muted-foreground/70 text-center py-4 font-body">
          No Chrome profiles found
        </div>
      )}
    </div>
  );
}
