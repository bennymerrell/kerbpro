import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Info, Shapes, MousePointerClick, FlaskConical, List, SquareDashedBottom, X, Download, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildMapCanvas, getPDFDimensions, calculateOptimalImageDimensions } from '../../lib/mapExport';

const CATEGORIES = ['Species', 'Free Parking', 'Hydrant', 'Incident', 'Public Toilet', 'Cafe / Van'];

export default function IOSNavSheet({
  open, onClose,
  isSpeciesMode, onToggleSpeciesMode,
  isAreaMode, onToggleAreaMode,
  isPlotting, onTogglePlotting,
  activeCategories, onChangeCategories,
  cells = [],
  selectedCell = null,
}) {
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const sheetRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose]);

  if (!open) return null;

  function navAndClose(path) { onClose(); navigate(path); }

  async function handleDownloadPDF() {
    setExporting(true);
    // Get optimal dimensions BEFORE building canvas so canvas size matches orientation
    const pdfDims = getPDFDimensions(cells, selectedCell);
    const canvas = await buildMapCanvas(cells, selectedCell);
    const { default: jsPDF } = await import('jspdf');
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
    onClose();
  }

  const toolItems = [
    { label: 'Spotted', icon: Info, active: isSpeciesMode, color: 'text-blue-500', activeBg: 'bg-blue-500', inactiveBg: 'bg-blue-100', action: () => { onToggleSpeciesMode(); onClose(); } },
    { label: 'Draw Cell', icon: Shapes, active: isAreaMode, color: 'text-indigo-500', activeBg: 'bg-indigo-500', inactiveBg: 'bg-indigo-100', action: () => { onToggleAreaMode(); onClose(); } },
    { label: exporting ? 'Exporting…' : 'Save PDF', icon: exporting ? Loader2 : Download, active: false, color: 'text-gray-500', activeBg: 'bg-gray-500', inactiveBg: 'bg-gray-100', action: handleDownloadPDF },
  ];

  const pageItems = [
    { label: 'Sightings', icon: List, path: '/sightings', bg: 'bg-green-500' },
    { label: 'Cells', icon: SquareDashedBottom, path: '/cells', bg: 'bg-blue-500' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full rounded-t-2xl bg-background shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(85vh - env(safe-area-inset-top, 0px))' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-base font-semibold text-foreground">Menu</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)', WebkitOverflowScrolling: 'touch' }}>

          {/* Map Tools */}
          <div className="px-4 mb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Map Tools</div>
            <div className="bg-muted/40 rounded-2xl overflow-hidden divide-y divide-border/60">
              {toolItems.map(({ label, icon: Icon, active, color, activeBg, inactiveBg, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${active ? 'bg-primary/5' : 'hover:bg-muted/60'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? activeBg : inactiveBg}`}>
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : color}`} />
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Data Pages */}
          <div className="px-4 mb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Data</div>
            <div className="bg-muted/40 rounded-2xl overflow-hidden divide-y divide-border/60">
              {pageItems.map(({ label, icon: Icon, path, bg }) => (
                <button
                  key={path}
                  onClick={() => navAndClose(path)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/60 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="ml-auto text-muted-foreground">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sightings Filter */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sightings Filter</div>
              <button
                onClick={() => onChangeCategories(activeCategories.length === CATEGORIES.length ? [] : [...CATEGORIES])}
                className="text-xs text-primary font-medium"
              >
                {activeCategories.length === CATEGORIES.length ? 'Hide all' : 'Show all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const on = activeCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => onChangeCategories(on ? activeCategories.filter(c => c !== cat) : [...activeCategories, cat])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout */}
          <div className="px-4 mb-4">
            <button
              onClick={() => base44.auth.logout()}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-2xl text-left hover:bg-red-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-sm font-medium text-red-500">Log Out</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}