import { useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ExportPanel() {
  const [loading, setLoading] = useState(false);

  async function captureMap() {
    const mapEl = document.querySelector('.leaflet-container');
    if (!mapEl) throw new Error('Map not found');
    return await html2canvas(mapEl, { useCORS: true, allowTaint: true, scale: 2 });
  }

  async function handleDownloadPDF() {
    setLoading(true);
    const canvas = await captureMap();
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
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

  return (
    <div className="absolute z-[1000]" style={{ bottom: 'max(8rem, calc(env(safe-area-inset-bottom) + 7rem))', right: '1rem' }}>
      <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-1.5 flex flex-col gap-1">
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          title="Download as PDF"
          className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Save PDF
        </button>
        <div className="h-px bg-border/50" />
        <button
          onClick={handlePrint}
          disabled={loading}
          title="Print map"
          className="flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg hover:bg-muted/60 transition-colors text-foreground disabled:opacity-50"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
      </div>
    </div>
  );
}