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
    <div className="fixed bottom-0 left-0 right-0 z-[1000] print:hidden bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-4 items-end sm:items-center sm:justify-between">
        {/* Orientation Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Orientation
          </label>
          <div className="flex gap-2">
            <Button
              variant={orientation === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onOrientationChange('portrait')}
              className="gap-2"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Portrait
            </Button>
            <Button
              variant={orientation === 'landscape' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onOrientationChange('landscape')}
              className="gap-2"
            >
              <Maximize2 className="h-3.5 w-3.5 rotate-90" />
              Landscape
            </Button>
          </div>
        </div>

        {/* Zoom Control */}
        <div className="flex flex-col gap-2 sm:flex-1 sm:max-w-xs">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Zoom: {zoom}
          </label>
          <input
            type="range"
            min="5"
            max="22"
            value={zoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value))}
            className="h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Print Button */}
        <Button
          onClick={onPrint}
          className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}