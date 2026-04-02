import { Info, Shapes, Download, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from 'react';
import { buildMapCanvas, getPDFDimensions, calculateOptimalImageDimensions } from '../../lib/mapExport';

export default function MapToolbar({ isPlotting, onTogglePlotting, onUndo, onClear, waypointCount, isSpeciesMode, onToggleSpeciesMode, isAreaMode, onToggleAreaMode, cells = [], selectedCell = null }) {
  const [exporting, setExporting] = useState(false);

  async function handleDownloadPDF() {
    setExporting(true);
    const canvas = await buildMapCanvas(cells, selectedCell);
    const { default: jsPDF } = await import('jspdf');
    
    // Get optimal dimensions based on cell shape
    const pdfDims = getPDFDimensions(cells, selectedCell);
    const pdf = new jsPDF({ orientation: pdfDims.orientation, unit: 'mm', format: 'a4' });
    
    // Calculate optimal image placement and size
    const imgDims = calculateOptimalImageDimensions(canvas.width, canvas.height, pdfDims.width, pdfDims.height);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imgDims.x, imgDims.y, imgDims.width, imgDims.height);
    if (selectedCell) {
      const boxX = 6, boxY = 6, rowH = 7, boxW = 45;
      pdf.setFillColor(255,255,255); pdf.setDrawColor(200,200,200); pdf.setLineWidth(0.3);
      pdf.roundedRect(boxX, boxY, boxW, 10 + rowH * 3 + 4, 2, 2, 'FD');
      pdf.setFontSize(9); pdf.setFont('helvetica','bold'); pdf.setTextColor(30,58,95);
      pdf.text('Cell', boxX+4, boxY+7);
      pdf.setFont('helvetica','normal'); pdf.setTextColor(30,30,30); pdf.setFontSize(7.5);
      pdf.text(`Name: ${(selectedCell.name||'Unnamed').substring(0,16)}`, boxX+4, boxY+15);
      pdf.text(`Area: ${(selectedCell.area||'-').substring(0,16)}`, boxX+4, boxY+15+rowH);
      const totalMi = (selectedCell.adopted_m!=null&&selectedCell.unadopted_m!=null) ? ((selectedCell.adopted_m+selectedCell.unadopted_m)/1609.34).toFixed(2) : '-';
      pdf.text(`Total: ${totalMi} mi`, boxX+4, boxY+15+rowH*2);
    }
    pdf.save('map-export.pdf');
    setExporting(false);
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-1.5 flex flex-col gap-1">
        <Button
          variant={isSpeciesMode ? "default" : "ghost"}
          size="sm"
          onClick={onToggleSpeciesMode}
          className={cn(
            "justify-start gap-2 h-9 px-3 text-xs font-medium rounded-lg transition-all",
            isSpeciesMode && "bg-primary hover:bg-primary/90 text-white shadow-md"
          )}
        >
          <Info className="h-3.5 w-3.5" />
          {isSpeciesMode ? "Recording..." : "Spotted"}
        </Button>

        <div className="h-px bg-border/50 my-0.5" />

        <Button
          variant={isAreaMode ? "default" : "ghost"}
          size="sm"
          onClick={onToggleAreaMode}
          className={cn(
            "justify-start gap-2 h-9 px-3 text-xs font-medium rounded-lg transition-all",
            isAreaMode && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          )}
        >
          <Shapes className="h-3.5 w-3.5" />
          {isAreaMode ? "Drawing..." : "Draw Cell"}
        </Button>

        <div className="h-px bg-border/50 my-0.5" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadPDF}
          disabled={exporting}
          className="justify-start gap-2 h-9 px-3 text-xs font-medium rounded-lg transition-all"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Save PDF
        </Button>
      </div>
    </div>
  );
}