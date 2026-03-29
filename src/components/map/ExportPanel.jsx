import { useState } from 'react';
import { Download, Printer, Loader2, Share2 } from 'lucide-react';

export default function ExportPanel({ cells = [] }) {
  const [loading, setLoading] = useState(false);

  async function captureMap() {
    const mapEl = document.querySelector('.leaflet-container');
    if (!mapEl) throw new Error('Map not found');
    const { default: html2canvas } = await import('html2canvas');
    return await html2canvas(mapEl, { useCORS: true, allowTaint: true, scale: 2 });
  }

  async function handleDownloadPDF() {
    setLoading(true);
    const canvas = await captureMap();
    const { default: jsPDF } = await import('jspdf');

    const mapW = canvas.width / 2;
    const mapH = canvas.height / 2;
    const summaryH = cells.length > 0 ? Math.min(cells.length * 10 + 40, 120) : 0;
    const pageH = mapH + summaryH;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [mapW, pageH] });

    // Map image
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, mapW, mapH);

    // Cell summary block
    if (cells.length > 0) {
      const y0 = mapH + 8;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 95);
      pdf.text('Cell Summary', 10, y0 + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(60, 60, 60);

      const headers = ['Cell Name', 'Area', 'Adopted (mi)', 'Unadopted (mi)', 'Total (mi)'];
      const colX = [10, 80, 160, 220, 280];

      // Header row
      pdf.setFont('helvetica', 'bold');
      headers.forEach((h, i) => pdf.text(h, colX[i], y0 + 16));
      pdf.setFont('helvetica', 'normal');

      cells.slice(0, 10).forEach((cell, idx) => {
        const rowY = y0 + 24 + idx * 9;
        const adoptedMi = cell.adopted_m != null ? (cell.adopted_m / 1609.34).toFixed(2) : '—';
        const unadoptedMi = cell.unadopted_m != null ? (cell.unadopted_m / 1609.34).toFixed(2) : '—';
        const totalMi = (cell.adopted_m != null && cell.unadopted_m != null)
          ? ((cell.adopted_m + cell.unadopted_m) / 1609.34).toFixed(2) : '—';
        const row = [cell.name || 'Unnamed', cell.area || '—', adoptedMi, unadoptedMi, totalMi];
        row.forEach((val, i) => pdf.text(String(val), colX[i], rowY));
      });
    }

    pdf.save('map-export.pdf');
    setLoading(false);
  }

  async function handlePrint() {
    setLoading(true);
    const canvas = await captureMap();
    const imgData = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Map Print</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
            img { max-width: 100%; max-height: 100vh; }
            @media print { body { margin: 0; } img { width: 100%; } }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    win.document.close();
    setLoading(false);
  }

  const [open, setOpen] = useState(false);

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
              onClick={() => { setOpen(false); handleDownloadPDF(); }}
              disabled={loading}
              className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Save PDF
            </button>
            <div className="h-px bg-border/50" />
            <button
              onClick={() => { setOpen(false); handlePrint(); }}
              disabled={loading}
              className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        )}
      </div>
    </div>
  );
}