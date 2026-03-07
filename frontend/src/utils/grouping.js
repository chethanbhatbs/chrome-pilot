export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getFaviconUrl(url) {
  // Use DuckDuckGo's favicon service — more reliable across domains than Google's
  try {
    const domain = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return null;
  }
}

export function getFaviconFallbackUrl(url) {
  // Google's service as fallback
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

// Shared favicon error handler: tries Google fallback, then hides
export function handleFaviconError(e) {
  const img = e.target;
  const src = img.src || '';
  if (src.includes('duckduckgo.com')) {
    const match = src.match(/ip3\/(.+)\.ico/);
    if (match) {
      img.src = `https://www.google.com/s2/favicons?domain=${match[1]}&sz=64`;
      return;
    }
  }
  img.style.display = 'none';
}

export function normalizeUrl(url) {
  if (!url) return url;
  // For chrome:// and chrome-extension:// URLs, use as-is (stripped of trailing slash)
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return url.replace(/\/$/, '');
  }
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, '') + u.search;
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
