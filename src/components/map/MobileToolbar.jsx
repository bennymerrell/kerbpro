import { useState } from 'react';
import { MousePointerClick, Undo2, Trash2, Info, Shapes, Share2, Download, Printer, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

async function captureMap() {
  const mapEl = document.querySelector('.leaflet-container');
  if (!mapEl) throw new Error('Map not found');
  const { default: html2canvas } = await import('html2canvas');
  return await html2canvas(mapEl, { useCORS: true, allowTaint: true, scale: 2 });
}

export default function MobileToolbar({
  isPlotting, onTogglePlotting,
  onUndo, onClear, waypointCount,
  isSpeciesMode, onToggleSpeciesMode,
  isAreaMode, onToggleAreaMode,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleDownloadPDF() {
    setExporting(true);
    setExportOpen(false);
    const canvas = await captureMap();
    const imgData = canvas.toDataURL('image/png');
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save('map-export.pdf');
    setExporting(false);
  }

  async function handlePrint() {
    setExporting(true);
    setExportOpen(false);
    const canvas = await captureMap();
    const imgData = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Map Print</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:white;}img{max-width:100%;max-height:100vh;}@media print{body{margin:0;}img{width:100%;}}</style></head><body><img src="${imgData}" onload="window.print();window.close();"/></body></html>`);
    win.document.close();
    setExporting(false);
  }
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[1000]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 flex items-center gap-1 px-2 py-1.5">
        {/* Plot Route — hidden */}

        <button
          onClick={onToggleSpeciesMode}
          title="Spotted"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            isSpeciesMode ? "bg-primary text-white shadow" : "text-foreground hover:bg-muted"
          )}
        >
          <Info className="h-4 w-4" />
        </button>

        <button
          onClick={onToggleAreaMode}
          title="Draw Cell"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            isAreaMode ? "bg-indigo-600 text-white shadow" : "text-foreground hover:bg-muted"
          )}
        >
          <Shapes className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-border/60 mx-0.5" />

        <div className="relative">
          <button
            onClick={() => setExportOpen(o => !o)}
            title="Export"
            className="h-10 w-10 rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-all"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          </button>
          {exportOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-1.5 flex flex-col gap-1 min-w-[130px]">
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground">
                <Download className="h-3.5 w-3.5" /> Save PDF
              </button>
              <div className="h-px bg-border/50" />
              <button onClick={handlePrint} className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          )}
        </div>

        {/* Undo/Clear — hidden */}
      </div>
    </div>
  );
}