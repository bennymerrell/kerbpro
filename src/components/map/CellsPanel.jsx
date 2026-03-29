import { useState } from 'react';
import { SquareDashedBottom, Eye, EyeOff, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CellsPanel({ cells, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);
  if (cells.length === 0) return null;

  return (
    <div className="absolute z-[1000]" style={{ bottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))', left: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 px-3 py-2 flex items-center gap-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-all"
      >
        <SquareDashedBottom className="h-4 w-4 text-indigo-600" />
        <span>Cells ({cells.length})</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2 w-56 max-h-64 overflow-y-auto space-y-1">
          {cells.map(cell => (
            <div key={cell.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 group">
              <span className={cn("flex-1 text-xs truncate", !cell.visible && "text-muted-foreground line-through")}>
                {cell.name || 'Unnamed Cell'}
              </span>
              <button
                onClick={() => onToggle(cell)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={cell.visible ? 'Hide' : 'Show'}
              >
                {cell.visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => onDelete(cell)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}