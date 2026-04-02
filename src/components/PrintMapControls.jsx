import { Printer, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrintMapControls({
  zoom,
  onZoomChange,
  orientation,
  onOrientationChange,
  onPrint
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] print:hidden">
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-4 flex flex-col gap-3 max-w-sm">
        {/* Orientation Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Page Orientation
          </label>
          <div className="flex gap-2">
            <Button
              variant={orientation === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onOrientationChange('portrait')}
              className="flex-1 gap-2"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Portrait
            </Button>
            <Button
              variant={orientation === 'landscape' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onOrientationChange('landscape')}
              className="flex-1 gap-2"
            >
              <Maximize2 className="h-3.5 w-3.5 rotate-90" />
              Landscape
            </Button>
          </div>
        </div>

        {/* Zoom Control */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Zoom Level: {zoom}
          </label>
          <input
            type="range"
            min="5"
            max="22"
            value={zoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex gap-1 text-xs text-muted-foreground">
            <span>Zoomed Out</span>
            <span className="ml-auto">Zoomed In</span>
          </div>
        </div>

        {/* Print Button */}
        <Button
          onClick={onPrint}
          className="w-full gap-2 bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Printer className="h-4 w-4" />
          Open Print Dialog
        </Button>
      </div>
    </div>
  );
}