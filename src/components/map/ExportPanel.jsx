import { useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import { buildMapCanvas } from '../../lib/mapExport';

export default function ExportPanel({ cells = [], selectedCell = null }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDownloadPDF() {
    setLoading(true);
    setOpen(false);
    const canvas = await buildMapCanvas(cells, selectedCell);
    const { default: jsPDF } = await import('jspdf');

    const pageW = 297;
    const pageH = 210;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);

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
    setLoading(false);
  }



  return (
    <div className="absolute z-[1000]" style={{ bottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 7rem))', right: '1rem' }}>
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          title="Export"
          className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 hover:bg-muted/80 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-foreground" /> : <Share2 className="h-4 w-4 text-foreground" />}
        </button>

        {open && (
          <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-1.5 flex flex-col gap-1 min-w-[130px]">
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Save PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}