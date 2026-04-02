import { TILE_LAYERS } from '../../lib/mapUtils';
import { Layers } from 'lucide-react';
import { useState } from 'react';
import { cn } from "@/lib/utils";

export default function TileLayerSelector({ currentLayer, onChangeLayer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-11 h-11 rounded-full bg-white/90 backdrop-blur-xl shadow-md flex items-center justify-center",
          open && "bg-muted"
        )}
      >
        <Layers className="h-5 w-5 text-gray-700" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-1.5 min-w-[160px]">
          {Object.entries(TILE_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => {
                onChangeLayer(key);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all",
                currentLayer === key
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {layer.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}