import { useState, useMemo, useCallback } from 'react';

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

  return { query, setQuery, results, resultCount, matchingTabIds, highlightText, clearSearch };
}
