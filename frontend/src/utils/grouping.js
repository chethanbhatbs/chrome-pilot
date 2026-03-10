export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Chrome caches favicons matching the site's active theme. When browsing in dark
// mode, sites like GitHub/ChatGPT serve white/light favicons. Chrome stores these
// (as SVG, data URI, or PNG). Displaying a white icon on ChromePilot's light panel
// makes it invisible. Fix: use Google S2 for public domains (always returns
// properly colored PNG), Chrome's favicon only for internal/private domains.
function _isInternalDomain(hostname) {
  if (!hostname) return true;
  // Private IPs
  if (/^(localhost|127\.\d|10\.\d|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) return true;
  // Internal TLDs / patterns
  if (/\.(local|internal|intranet|corp|lan|test)$/i.test(hostname)) return true;
  if (/\binternal\b/i.test(hostname)) return true;
  // Single-word hostname (no dots)
  if (!hostname.includes('.')) return true;
  return false;
}

export function getFaviconUrl(url, chromeFavIconUrl) {
  try {
    const hostname = new URL(url).hostname;
    // Internal/private domains: Chrome's favicon is the only source that works
    // (external services like Google S2 can't reach internal networks)
    if (_isInternalDomain(hostname)) {
      return chromeFavIconUrl || null;
    }
    // Public domains: Google S2 — always returns a properly themed, colored PNG
    // regardless of the user's browser dark/light mode setting
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    // Can't parse URL — fall back to Chrome's favicon
    return chromeFavIconUrl || null;
  }
}

// Fallback chain (all PNG/ICO — no theme-dependent SVGs):
// 1. Chrome's non-SVG favIconUrl OR Google S2 128px  (set by getFaviconUrl)
// 2. DuckDuckGo icons service
// 3. Direct site /favicon.ico
// 4. Google S2 64px
// 5. Clearbit Logo API
// 6. Chrome's original favicon (SVG or not — last resort before letter avatar)
// 7. Letter avatar
export function handleFaviconError(e) {
  const img = e.target;
  const src = img.src || '';
  const tabUrl = img.dataset.tabUrl || '';
  const chromeFavicon = img.dataset.chromeFavicon || '';
  const tried = (img.dataset.faviconTried || '').split(',').filter(Boolean);

  let domain = '';
  try { domain = new URL(tabUrl || src).hostname; } catch {}
  if (!domain) {
    _showLetterAvatar(img, tabUrl || src);
    return;
  }

  // Step 2: DuckDuckGo
  if (!tried.includes('ddg')) {
    img.dataset.faviconTried = [...tried, 'ddg'].join(',');
    img.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    return;
  }

  // Step 3: Direct /favicon.ico from the site
  if (!tried.includes('direct')) {
    try {
      const origin = new URL(tabUrl).origin;
      img.dataset.faviconTried = [...tried, 'direct'].join(',');
      img.src = `${origin}/favicon.ico`;
      return;
    } catch {}
  }

  // Step 4: Google S2 64px (different size sometimes returns different icon)
  if (!tried.includes('google64')) {
    img.dataset.faviconTried = [...tried, 'google64'].join(',');
    img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    return;
  }

  // Step 5: Clearbit Logo API
  if (!tried.includes('clearbit')) {
    img.dataset.faviconTried = [...tried, 'clearbit'].join(',');
    img.src = `https://logo.clearbit.com/${domain}`;
    return;
  }

  // Step 6: Chrome's original favicon (even SVG — better than nothing for internal apps)
  if (!tried.includes('chrome') && chromeFavicon && chromeFavicon !== src) {
    img.dataset.faviconTried = [...tried, 'chrome'].join(',');
    img.src = chromeFavicon;
    return;
  }

  // Step 7: All sources exhausted → letter avatar
  _showLetterAvatar(img, tabUrl || src);
}

// Deterministic color from a string — produces a vibrant hue per domain
const AVATAR_COLORS = [
  { bg: '#E8384F', fg: '#fff' }, // red
  { bg: '#FD612C', fg: '#fff' }, // orange
  { bg: '#EEC300', fg: '#fff' }, // yellow
  { bg: '#A4CF30', fg: '#fff' }, // lime
  { bg: '#37C866', fg: '#fff' }, // green
  { bg: '#20AAEA', fg: '#fff' }, // blue
  { bg: '#4186E0', fg: '#fff' }, // indigo
  { bg: '#7A6FF0', fg: '#fff' }, // violet
  { bg: '#AA62E3', fg: '#fff' }, // purple
  { bg: '#E362E3', fg: '#fff' }, // pink
  { bg: '#EA4E9D', fg: '#fff' }, // magenta
  { bg: '#FC913A', fg: '#fff' }, // tangerine
];

function _avatarColorForString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getLetterAvatar(url) {
  let letter = '?';
  let domain = '';
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
    letter = domain.charAt(0).toUpperCase() || '?';
  } catch {}
  const color = _avatarColorForString(domain || url || '?');
  return { letter, color };
}

function _showLetterAvatar(img, urlHint) {
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.tp-letter-avatar')) {
    const { letter, color } = getLetterAvatar(urlHint);
    const avatar = document.createElement('div');
    avatar.className = 'tp-letter-avatar';
    avatar.textContent = letter;
    Object.assign(avatar.style, {
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '9px', fontWeight: '700', letterSpacing: '0.5px',
      color: color.fg, background: color.bg, borderRadius: '3px',
    });
    parent.appendChild(avatar);
  }
}

export function normalizeUrl(url) {
  if (!url) return url;
  // For chrome:// and chrome-extension:// URLs, use as-is (stripped of trailing slash)
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return url.replace(/\/$/, '');
  }
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return url;
  }
}

export function findDuplicates(allTabs) {
  const urlMap = {};
  allTabs.forEach(tab => {
    if (!tab.url) return;
    const normalized = normalizeUrl(tab.url);
    if (!urlMap[normalized]) urlMap[normalized] = [];
    urlMap[normalized].push(tab);
  });
  return Object.entries(urlMap)
    .filter(([, tabs]) => tabs.length > 1)
    .map(([url, tabs]) => ({ url, tabs }));
}

export function groupByDomain(allTabs) {
  const domainMap = {};
  allTabs.forEach(tab => {
    const domain = getDomain(tab.url);
    if (!domainMap[domain]) domainMap[domain] = [];
    domainMap[domain].push(tab);
  });
  return Object.entries(domainMap)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([domain, tabs]) => ({ domain, tabs }));
}
