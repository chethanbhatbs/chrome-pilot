import { useRef, useEffect, useState } from 'react';
import { Search, X, Globe } from 'lucide-react';
import { getFaviconUrl } from '@/utils/grouping';

export function SearchBar({ query, setQuery, resultCount, clearSearch, inputRef: externalRef, suggestions, onSwitchTab }) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === 'Escape' && query) {
        clearSearch();
        ref.current?.blur();
        setShowSuggestions(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [query, clearSearch, ref]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions?.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      const s = suggestions[selectedIdx];
      if (s.type === 'tab' && onSwitchTab) {
        onSwitchTab(s.id);
        setShowSuggestions(false);
      } else if (s.type === 'domain') {
        setQuery(s.domain);
      }
    }
  };

  const hasSuggestions = suggestions && suggestions.length > 0 && showSuggestions && query.length > 0;

  return (
    <div className="relative" ref={wrapperRef} data-testid="search-bar">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
        size={13}
        strokeWidth={1.5}
      />
      <input
        ref={ref}
        data-testid="search-input"
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setSelectedIdx(-1); }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search tabs..."
        className="w-full h-7 pl-7 pr-16 text-[11px] bg-white/[0.04] border-none rounded-md
          ring-1 ring-white/[0.06] focus:ring-primary/50 focus:outline-none
          placeholder:text-muted-foreground/40 text-foreground font-body"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <>
            <span className="text-[9px] text-muted-foreground/50 font-mono">
              {resultCount}
            </span>
            <button
              data-testid="search-clear-btn"
              onClick={() => { clearSearch(); setShowSuggestions(false); }}
              className="p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={11} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {/* Suggestions dropdown */}
      {hasSuggestions && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden"
          data-testid="search-suggestions"
        >
          {suggestions.map((s, idx) => (
            <button
              key={s.id}
              data-testid={`search-suggestion-${s.id}`}
              onClick={() => {
                if (s.type === 'tab' && onSwitchTab) {
                  onSwitchTab(s.id);
                  setShowSuggestions(false);
                } else if (s.type === 'domain') {
                  setQuery(s.domain);
                }
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors
                ${idx === selectedIdx ? 'bg-primary/10' : 'hover:bg-white/[0.04]'}
                ${idx > 0 ? 'border-t border-border/30' : ''}`}
            >
              {s.type === 'tab' ? (
                <>
                  <img src={getFaviconUrl(s.url)} alt="" className="w-3.5 h-3.5 rounded-[2px] shrink-0" onError={e => e.target.style.display = 'none'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-body truncate text-foreground/80">{s.title}</div>
                    <div className="text-[9px] text-muted-foreground/50 truncate">{s.domain}</div>
                  </div>
                </>
              ) : (
                <>
                  <Globe size={13} className="text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-body text-foreground/80">{s.domain}</div>
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{s.count} tabs</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
