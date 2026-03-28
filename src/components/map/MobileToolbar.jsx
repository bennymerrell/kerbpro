import { MousePointerClick, Undo2, Trash2, Leaf, Shapes } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function MobileToolbar({
  isPlotting, onTogglePlotting,
  onUndo, onClear, waypointCount,
  isSpeciesMode, onToggleSpeciesMode,
  isAreaMode, onToggleAreaMode,
}) {
  return (
    <div
      className="sm:hidden absolute left-1/2 -translate-x-1/2 z-[1000]"
      style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
    >
      <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={onTogglePlotting}
          title="Plot Route"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            isPlotting ? "bg-primary text-primary-foreground shadow" : "text-foreground hover:bg-muted"
          )}
        >
          <MousePointerClick className="h-4 w-4" />
        </button>

        <button
          onClick={onToggleSpeciesMode}
          title="Log Species"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            isSpeciesMode ? "bg-emerald-600 text-white shadow" : "text-foreground hover:bg-muted"
          )}
        >
          <Leaf className="h-4 w-4" />
        </button>

        <button
          onClick={onToggleAreaMode}
          title="Draw Area"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            isAreaMode ? "bg-indigo-600 text-white shadow" : "text-foreground hover:bg-muted"
          )}
        >
          <Shapes className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-border/60 mx-0.5" />

        <button
          onClick={onUndo}
          title="Undo"
          disabled={waypointCount === 0}
          className="h-10 w-10 rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-all disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          onClick={onClear}
          title="Clear All"
          disabled={waypointCount === 0}
          className="h-10 w-10 rounded-xl flex items-center justify-center text-destructive hover:bg-muted transition-all disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}