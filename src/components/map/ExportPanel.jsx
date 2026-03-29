import { useState } from 'react';
import { Download, Printer, Loader2, Share2 } from 'lucide-react';
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
      const boxX = 6, boxY = 6, rowH = 9, boxW = 130;
      const boxH = 16 + rowH + 6;
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 58, 95);
      pdf.text('Cell Summary', boxX + 4, boxY + 8);
      const colX = [boxX + 4, boxX + 48, boxX + 85];
      const headers = ['Name', 'Area', 'Total (mi)'];
      pdf.setFontSize(7.5); pdf.setTextColor(100, 100, 100);
      headers.forEach((h, i) => pdf.text(h, colX[i], boxY + 15));
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 30, 30); pdf.setFontSize(8.5);
      const rowY = boxY + 15 + rowH;
      const totalMi = (selectedCell.adopted_m != null && selectedCell.unadopted_m != null)
        ? ((selectedCell.adopted_m + selectedCell.unadopted_m) / 1609.34).toFixed(2) : '-';
      const name = selectedCell.name || 'Unnamed';
      const area = selectedCell.area || '-';
      [name, area, totalMi].forEach((v, i) => pdf.text(String(v).substring(0, 18), colX[i], rowY));
    }

    pdf.save('map-export.pdf');
    setLoading(false);
  }

  async function handlePrint() {
    setLoading(true);
    setOpen(false);
    const canvas = await buildMapCanvas(cells, selectedCell);
    const imgData = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Map Print</title><style>body{margin:0;}img{width:100%;display:block;}@media print{body{margin:0;}img{width:100%;}}</style></head><body><img src="${imgData}" onload="window.print();window.close();"/></body></html>`);
    win.document.close();
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
            <div className="h-px bg-border/50" />
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </div>
        )}
      </div>
    </div>
  );
}