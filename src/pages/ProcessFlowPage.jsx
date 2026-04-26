import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ProcessFlowDiagram from '../components/ProcessFlowDiagram';

export default function ProcessFlowPage() {
  const navigate = useNavigate();
  const diagramRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  async function handleExportPDF() {
    if (!diagramRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(diagramRef.current, {
        scale: 2,
        backgroundColor: '#f8fafc',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = imgW / imgH;
      const sliceHeightPx = Math.floor((pageH - margin * 2) / (usableW / imgW) );
      const totalPages = Math.ceil(imgH / sliceHeightPx);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        const srcY = page * sliceHeightPx;
        const srcH = Math.min(sliceHeightPx, imgH - srcY);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgW;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);
        const sliceData = sliceCanvas.toDataURL('image/png');
        const printH = (srcH / imgW) * usableW;
        pdf.addImage(sliceData, 'PNG', margin, margin, usableW, printH);
      }

      pdf.save('KerbPro-Process-Flow.pdf');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-sm text-gray-900">KerbPro — Process Flow</h1>
          <p className="text-[11px] text-gray-500">Visual system diagram</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {exporting ? 'Exporting…' : 'Download PDF'}
        </button>
      </div>

      {/* Diagram */}
      <div className="py-6 px-4 flex justify-center">
        <ProcessFlowDiagram ref={diagramRef} />
      </div>
    </div>
  );
}