import { useState } from 'react';
import { Info, Shapes, Download, Loader2 } from 'lucide-react';
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
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl flex items-center gap-0.5 px-2 py-2">
        <button
          onClick={onToggleSpeciesMode}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-14 w-16 rounded-xl transition-all",
            isSpeciesMode ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Info className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Spotted</span>
        </button>

        <button
          onClick={onToggleAreaMode}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-14 w-16 rounded-xl transition-all",
            isAreaMode ? "bg-indigo-500 text-white" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Shapes className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Draw Cell</span>
        </button>

        <div className="w-px h-8 bg-gray-200 mx-0.5" />

        <button
          onClick={handleDownloadPDF}
          disabled={exporting}
          className="flex flex-col items-center justify-center gap-1 h-14 w-16 rounded-xl text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-40"
        >
          {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          <span className="text-[10px] font-medium leading-none">Save PDF</span>
        </button>
      </div>
    </div>
  );
}