import { useState } from 'react';
import { Printer, Maximize2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrintMapControls({
  zoom,
  onZoomChange,
  orientation,
  onOrientationChange,
  onPrint,
  generating = false
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="fixed left-0 right-0 z-[2000] print:!hidden bg-background/95 backdrop-blur-md border-t border-border shadow-lg"
      style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Toggle bar */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-center py-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span className="text-xs ml-1 font-medium">{collapsed ? 'Show controls' : 'Hide controls'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between">
          {/* Orientation */}
          <div className="flex gap-2">
            <Button
              variant={orientation === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onOrientationChange('portrait')}
              className="flex-1 gap-1.5"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Portrait
            </Button>
            <Button
              variant={orientation === 'landscape' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onOrientationChange('landscape')}
              className="flex-1 gap-1.5"
            >
              <Maximize2 className="h-3.5 w-3.5 rotate-90" />
              Landscape
            </Button>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 sm:flex-1 sm:max-w-xs">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Zoom: {zoom.toFixed(1)}</span>
            <input
              type="range"
              min="5"
              max="22"
              step="0.01"
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Generate PDF */}
          <Button
            onClick={onPrint}
            disabled={generating}
            className="gap-2 bg-primary hover:bg-primary/90"
            size="sm"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {generating ? 'Generating...' : 'Generate PDF'}
          </Button>
        </div>
      )}
    </div>
  );
}