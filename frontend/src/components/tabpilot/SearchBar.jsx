import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({ query, setQuery, resultCount, clearSearch, inputRef: externalRef }) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === 'Escape' && query) {
        clearSearch();
        ref.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [query, clearSearch, ref]);

  return (
    <div className="relative" data-testid="search-bar">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={14}
        strokeWidth={1.5}
      />
      <input
        ref={ref}
        data-testid="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tabs..."
        className="w-full h-7 pl-7 pr-16 text-[11px] bg-white/[0.04] border-none rounded-md
          ring-1 ring-white/[0.06] focus:ring-primary/50 focus:outline-none
          placeholder:text-muted-foreground/40 text-foreground font-body"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <>
            <span className="text-[10px] text-muted-foreground font-mono">
              {resultCount} found
            </span>
            <button
              data-testid="search-clear-btn"
              onClick={clearSearch}
              className="p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
