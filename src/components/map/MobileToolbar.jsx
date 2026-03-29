import { useState } from 'react';
import { MousePointerClick, Info, Shapes, Share2, Download, Printer, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { buildMapCanvas } from '../../lib/mapExport';



export default function MobileToolbar({
  isPlotting, onTogglePlotting,
  onUndo, onClear, waypointCount,
  isSpeciesMode, onToggleSpeciesMode,
  isAreaMode, onToggleAreaMode,
  cells = [],
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleDownloadPDF() {
    setExporting(true);
    setExportOpen(false);
    const canvas = await buildMapCanvas(cells);
    const { default: jsPDF } = await import('jspdf');

    const pageW = 297;
    const pageH = 210;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const imgRatio = canvas.width / canvas.height;
    const imgH = Math.min(pageH, pageW / imgRatio);
    const imgW = imgH * imgRatio;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, 0, imgW, imgH);

    if (cells.length > 0) {
      const boxX = 6, boxY = 6, rowH = 9;
      const boxW = 130;
      const boxH = 16 + cells.slice(0, 8).length * rowH + 6;

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 58, 95);
      pdf.text('Cell Summary', boxX + 4, boxY + 8);

      const colX = [boxX + 4, boxX + 48, boxX + 80, boxX + 105];
      const headers = ['Cell Name', 'Adopted (mi)', 'Unadopted (mi)', 'Total (mi)'];
      pdf.setFontSize(7.5); pdf.setTextColor(100, 100, 100);
      headers.forEach((h, i) => pdf.text(h, colX[i], boxY + 15));

      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 30, 30); pdf.setFontSize(8.5);
      cells.slice(0, 8).forEach((cell, idx) => {
        const rowY = boxY + 15 + (idx + 1) * rowH;
        const adoptedMi = cell.adopted_m != null ? (cell.adopted_m / 1609.34).toFixed(2) : '-';
        const unadoptedMi = cell.unadopted_m != null ? (cell.unadopted_m / 1609.34).toFixed(2) : '-';
        const totalMi = (cell.adopted_m != null && cell.unadopted_m != null)
          ? ((cell.adopted_m + cell.unadopted_m) / 1609.34).toFixed(2) : '-';
        [cell.name || 'Unnamed', adoptedMi, unadoptedMi, totalMi]
          .forEach((v, i) => pdf.text(String(v).substring(0, 18), colX[i], rowY));
      });
    }

    pdf.save('map-export.pdf');
    setExporting(false);
  }

  async function handlePrint() {
    setExporting(true);
    setExportOpen(false);
    const canvas = await buildMapCanvas(cells);
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
      </div>
    </div>
  );
}