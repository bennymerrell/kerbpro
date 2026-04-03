import { Printer, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrintMapControls({
  zoom,
  onZoomChange,
  orientation,
  onOrientationChange,
  onPrint,
  generating = false
}) {
  return (
    <div className="fixed left-0 right-0 z-[1000] print:!hidden bg-background/95 backdrop-blur-md border-t border-border shadow-lg" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
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
            Zoom: {zoom.toFixed(1)}
          </label>
          <input
            type="range"
            min="5"
            max="22"
            step="0.1"
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Generate PDF Button */}
        <Button
          onClick={onPrint}
          disabled={generating}
          className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90"
          size="sm"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {generating ? 'Generating...' : 'Generate PDF'}
        </Button>
      </div>
    </div>
  );
}