import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function SearchBox({ onLocationFound }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setShowResults(true);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
    );
    const data = await response.json();
    setResults(data);
    setLoading(false);
  }

  function selectResult(result) {
    onLocationFound({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name,
    });
    setShowResults(false);
    setQuery(result.display_name.split(',')[0]);
  }

  return (
    <div className="absolute top-4 left-4 right-24 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[1000] sm:w-[90%] sm:max-w-md">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search location..."
            className={cn(
              "w-full h-10 pl-10 pr-4 bg-card/95 backdrop-blur-md",
              "rounded-xl shadow-lg border border-border/50",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
              "transition-all"
            )}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

      {showResults && results.length > 0 && (
        <div className="mt-2 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 overflow-hidden">
          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => selectResult(result)}
              className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="font-medium text-foreground truncate">{result.display_name.split(',')[0]}</div>
              <div className="text-muted-foreground truncate mt-0.5">{result.display_name}</div>
            </button>
          ))}
        </div>
      )}

      {showResults && !loading && results.length === 0 && query && (
        <div className="mt-2 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 px-4 py-3 text-xs text-muted-foreground">
          No results found
        </div>
      )}
    </div>
  );
}