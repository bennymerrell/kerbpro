import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";


export default function SearchBox({ mapRef, onLocationFound }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setShowResults(true);


      const searchQuery = query.toLowerCase().includes('uk') ? query : `${query}, UK`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&countrycodes=gb&addressdetails=1`
      );
      const data = await response.json();
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function selectResult(result) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (mapRef?.current) {
      mapRef.current.flyTo([lat, lng], 16, { animate: true });
    } else if (onLocationFound) {
      onLocationFound({ lat, lng, name: result.display_name });
    }
    setShowResults(false);
    setResults([]);
    setQuery('');
    setShowResults(false);
  }


  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={e => e.preventDefault()}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className={cn(
              "w-full h-11 pl-10 pr-10 bg-white/90 backdrop-blur-xl",
              "rounded-full shadow-md border-0",
              "text-[15px] text-gray-900 placeholder:text-gray-400 font-normal",
              "focus:outline-none focus:ring-2 focus:ring-blue-400/40",
              "transition-all"
            )}
          />
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
      </form>

      {showResults && results.length > 0 && (
        <div
          onMouseDown={e => e.preventDefault()}
          className="absolute top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden z-[2000]"
          style={{ left: 0, minWidth: '320px', width: 'max-content', maxWidth: 'calc(100vw - 2rem)' }}
        >
          {results.map((result, i) => {
            const parts = result.display_name.split(',');
            const title = parts[0].trim();
            const subtitle = parts.slice(1).join(',').trim();
            return (
              <button
                key={i}
                onClick={() => selectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="text-[14px] font-medium text-gray-900">{title}</div>
                {subtitle && <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{subtitle}</div>}
              </button>
            );
          })}
        </div>
      )}

      {showResults && !loading && results.length === 0 && query.length >= 3 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl px-4 py-3 text-sm text-gray-400 text-center z-[2000]">
          No results found
        </div>
      )}
    </div>
  );
}