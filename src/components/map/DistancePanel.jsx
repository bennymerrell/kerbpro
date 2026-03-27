import { Route, MapPin } from 'lucide-react';
import { calculateTotalDistance, formatDistance, formatDistanceMiles, getSegmentDistances } from '../../lib/mapUtils';
import { cn } from "@/lib/utils";
import { useState } from 'react';

export default function DistancePanel({ waypoints }) {
  const [expanded, setExpanded] = useState(false);

  if (waypoints.length === 0) return null;

  const totalDistance = calculateTotalDistance(waypoints);
  const segments = getSegmentDistances(waypoints);

  return (
    <div className="absolute bottom-6 left-4 z-[1000] max-w-xs">
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 overflow-hidden">
        {/* Summary bar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-all"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Route className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs text-muted-foreground font-medium">Total Distance</div>
            <div className="font-semibold text-sm text-foreground font-mono tracking-tight">
              {formatDistance(totalDistance)}
              <span className="text-muted-foreground font-normal ml-2">
                ({formatDistanceMiles(totalDistance)})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{waypoints.length}</span>
          </div>
        </button>

        {/* Expanded leg details */}
        {expanded && segments.length > 0 && (
          <div className="border-t border-border/50 px-4 py-2 max-h-48 overflow-y-auto">
            {segments.map((dist, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 text-xs">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                    i === 0 ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
                  )}>
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                    i === segments.length - 1 ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                  )}>
                    {i + 2}
                  </span>
                </div>
                <span className="font-mono text-foreground font-medium">
                  {formatDistance(dist)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}