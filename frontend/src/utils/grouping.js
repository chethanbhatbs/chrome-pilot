export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

export function normalizeUrl(url) {
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
    if (tab.url.startsWith('chrome://')) return;
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
