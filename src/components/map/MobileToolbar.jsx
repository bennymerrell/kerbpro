import { useState } from 'react';
import { MousePointerClick, Info, Shapes, Share2, Download, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { buildMapCanvas } from '../../lib/mapExport';



export default function MobileToolbar({
  isPlotting, onTogglePlotting,
  onUndo, onClear, waypointCount,
  isSpeciesMode, onToggleSpeciesMode,
  isAreaMode, onToggleAreaMode,
  cells = [],
  selectedCell = null,
  onSelectCell = null,
}) {
  const [exporting, setExporting] = useState(false);

  async function handleDownloadPDF() {
    setExporting(true);
    const canvas = await buildMapCanvas(cells, selectedCell);
    const { default: jsPDF } = await import('jspdf');

    const pageW = 297;
    const pageH = 210;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const imgRatio = canvas.width / canvas.height;
    const imgH = Math.min(pageH, pageW / imgRatio);
    const imgW = imgH * imgRatio;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, 0, imgW, imgH);

    if (selectedCell) {
      const boxX = 6, boxY = 6, rowH = 7, boxW = 45;
      const boxH = 10 + rowH * 3 + 4;
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');
      pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 58, 95);
      pdf.text('Cell', boxX + 4, boxY + 7);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 30, 30); pdf.setFontSize(7.5);
      const name = selectedCell.name || 'Unnamed';
      const area = selectedCell.area || '-';
      const totalMi = (selectedCell.adopted_m != null && selectedCell.unadopted_m != null)
        ? ((selectedCell.adopted_m + selectedCell.unadopted_m) / 1609.34).toFixed(2) : '-';
      pdf.text(`Name: ${name.substring(0, 16)}`, boxX + 4, boxY + 15);
      pdf.text(`Area: ${area.substring(0, 16)}`, boxX + 4, boxY + 15 + rowH);
      pdf.text(`Total: ${totalMi} mi`, boxX + 4, boxY + 15 + rowH * 2);
    }

    pdf.save('map-export.pdf');
    setExporting(false);
  }



  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[1000]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 flex items-center gap-1 px-2 py-1.5">
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

        <button
          onClick={onTogglePlotting}
          title="Plot Route"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            isPlotting ? "bg-primary text-white shadow" : "text-foreground hover:bg-muted"
          )}
        >
          <MousePointerClick className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-border/60 mx-0.5" />

        <button
          onClick={handleDownloadPDF}
          disabled={exporting}
          title="Save PDF"
          className="h-10 w-10 rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}