import { Info, Shapes, Download, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

export default function MapToolbar({ isPlotting, onTogglePlotting, onUndo, onClear, waypointCount, isSpeciesMode, onToggleSpeciesMode, isAreaMode, onToggleAreaMode, cells = [], selectedCell = null }) {
  const navigate = useNavigate();

  function handlePrintMap() {
    if (selectedCell) {
      navigate(`/print-map/${selectedCell.id}`);
    }
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-1.5 flex flex-col gap-1">
        <Button
          variant={isSpeciesMode ? "default" : "ghost"}
          size="sm"
          onClick={onToggleSpeciesMode}
          className={cn(
            "justify-start gap-2 h-9 px-3 text-xs font-medium rounded-lg transition-all",
            isSpeciesMode && "bg-primary hover:bg-primary/90 text-white shadow-md"
          )}
        >
          <Info className="h-3.5 w-3.5" />
          {isSpeciesMode ? "Recording..." : "Spotted"}
        </Button>

        <div className="h-px bg-border/50 my-0.5" />

        <Button
          variant={isAreaMode ? "default" : "ghost"}
          size="sm"
          onClick={onToggleAreaMode}
          className={cn(
            "justify-start gap-2 h-9 px-3 text-xs font-medium rounded-lg transition-all",
            isAreaMode && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          )}
        >
          <Shapes className="h-3.5 w-3.5" />
          {isAreaMode ? "Drawing..." : "Draw Cell"}
        </Button>

        <div className="h-px bg-border/50 my-0.5" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrintMap}
          disabled={!selectedCell}
          className="justify-start gap-2 h-9 px-3 text-xs font-medium rounded-lg transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          Print Map
        </Button>
      </div>
    </div>
  );
}