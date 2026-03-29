import { useState } from 'react';
import { Download, Printer, Loader2, Share2 } from 'lucide-react';

export default function ExportPanel({ cells = [] }) {
  const [loading, setLoading] = useState(false);

  async function captureMap() {
    const mapEl = document.querySelector('.leaflet-container');
    if (!mapEl) throw new Error('Map not found');
    const { default: html2canvas } = await import('html2canvas');
    return await html2canvas(mapEl, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: false,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      width: mapEl.offsetWidth,
      height: mapEl.offsetHeight,
      windowWidth: mapEl.offsetWidth,
      windowHeight: mapEl.offsetHeight,
    });
  }

  async function handleDownloadPDF() {
    setLoading(true);
    const canvas = await captureMap();
    const { default: jsPDF } = await import('jspdf');

    // A4 landscape in mm: 297 x 210
    const pageW = 297;
    const pageH = 210;
    const summaryH = cells.length > 0 ? Math.min(cells.length * 7 + 22, 60) : 0;
    const mapAreaH = pageH - summaryH - (summaryH > 0 ? 4 : 0);

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Map image — full page
    const imgRatio = canvas.width / canvas.height;
    const imgH = Math.min(pageH, pageW / imgRatio);
    const imgW = imgH * imgRatio;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, 0, imgW, imgH);

    // Cell summary — white box top-left overlay
    if (cells.length > 0) {
      const boxX = 6;
      const boxY = 6;
      const rowH = 9;
      const boxW = 130;
      const boxH = 16 + cells.slice(0, 8).length * rowH + 6;

      // White box with shadow effect (border)
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

      // Title
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 95);
      pdf.text('Cell Summary', boxX + 4, boxY + 8);

      // Headers
      const colX = [boxX + 4, boxX + 48, boxX + 80, boxX + 105];
      const headers = ['Cell Name', 'Adopted (mi)', 'Unadopted (mi)', 'Total (mi)'];
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 100, 100);
      headers.forEach((h, i) => pdf.text(h, colX[i], boxY + 15));

      // Rows
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(8.5);
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