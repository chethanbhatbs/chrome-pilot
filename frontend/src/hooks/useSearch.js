import { useState, useMemo, useCallback } from 'react';
import { getDomain } from '@/utils/grouping';

export function useSearch(allTabs) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return allTabs.filter(tab =>
      tab.title.toLowerCase().includes(q) ||
      tab.url.toLowerCase().includes(q)
    );
  }, [query, allTabs]);

  const resultCount = results ? results.length : 0;
  const matchingTabIds = useMemo(() =>
    results ? new Set(results.map(t => t.id)) : null,
    [results]
  );

  // Search suggestions: top 5 matching tabs + unique domains
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 1) return [];
    const q = query.toLowerCase();
    const matched = allTabs.filter(tab =>
      tab.title.toLowerCase().includes(q) ||
      tab.url.toLowerCase().includes(q)
    );
    const tabSuggestions = matched.slice(0, 5).map(t => ({
      type: 'tab',
      id: t.id,
      title: t.title,
      domain: getDomain(t.url),
      url: t.url,
    }));
    // Unique domain suggestions
    const domains = [...new Set(matched.map(t => getDomain(t.url)))];
    const domainSuggestions = domains
      .filter(d => d.toLowerCase().includes(q))
      .slice(0, 3)
      .map(d => ({
        type: 'domain',
        id: `domain-${d}`,
        title: d,
        domain: d,
        count: matched.filter(t => getDomain(t.url) === d).length,
      }));
    return [...domainSuggestions, ...tabSuggestions];
  }, [query, allTabs]);

  const highlightText = useCallback((text) => {
    if (!query.trim()) return text;
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-tp-highlight/30 text-inherit rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }, [query]);

  const clearSearch = useCallback(() => setQuery(''), []);

  return { query, setQuery, results, resultCount, matchingTabIds, highlightText, clearSearch, suggestions };
}
