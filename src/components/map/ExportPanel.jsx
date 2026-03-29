import { useState } from 'react';
import { Download, Printer, Loader2, Share2 } from 'lucide-react';
import L from 'leaflet';

export default function ExportPanel({ cells = [], mapRef }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function buildMapCanvas() {
    const CANVAS_W = 1400;
    const CANVAS_H = 990;
    const TILE_SIZE = 256;

    // Collect all visible cell points to determine bounds
    const allPoints = cells.filter(c => c.visible !== false).flatMap(c => {
      try { return JSON.parse(c.points); } catch { return []; }
    });

    let center, zoom;
    if (allPoints.length > 0) {
      const lats = allPoints.map(p => p.lat);
      const lngs = allPoints.map(p => p.lng);
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
      center = bounds.getCenter();
      // Find zoom where cell fits inside canvas with padding
      zoom = 18;
      for (let z = 18; z >= 1; z--) {
        const nw = L.CRS.EPSG3857.latLngToPoint(bounds.getNorthWest(), z);
        const se = L.CRS.EPSG3857.latLngToPoint(bounds.getSouthEast(), z);
        if (Math.abs(se.x - nw.x) <= CANVAS_W * 0.8 && Math.abs(se.y - nw.y) <= CANVAS_H * 0.8) {
          zoom = z;
          break;
        }
      }
    } else {
      // Fallback: use current map view
      const map = mapRef?.current;
      if (map) { center = map.getCenter(); zoom = map.getZoom(); }
      else { center = L.latLng(51.505, -1.27); zoom = 13; }
    }

    const centerPx = L.CRS.EPSG3857.latLngToPoint(center, zoom);
    const originX = centerPx.x - CANVAS_W / 2;
    const originY = centerPx.y - CANVAS_H / 2;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e8e0d8';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Detect tile URL pattern from live map
    const existingTile = document.querySelector('.leaflet-tile-pane img.leaflet-tile');
    let tileUrlFn = (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    if (existingTile?.src?.includes('arcgisonline')) {
      tileUrlFn = (x, y, z) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }

    const tX0 = Math.floor(originX / TILE_SIZE);
    const tY0 = Math.floor(originY / TILE_SIZE);
    const tX1 = Math.ceil((originX + CANVAS_W) / TILE_SIZE);
    const tY1 = Math.ceil((originY + CANVAS_H) / TILE_SIZE);

    const tilePromises = [];
    for (let tx = tX0; tx <= tX1; tx++) {
      for (let ty = tY0; ty <= tY1; ty++) {
        const cx = tx * TILE_SIZE - originX;
        const cy = ty * TILE_SIZE - originY;
        tilePromises.push(
          fetch(tileUrlFn(tx, ty, zoom))
            .then(r => r.blob())
            .then(blob => new Promise(resolve => {
              const u = URL.createObjectURL(blob);
              const img = new Image();
              img.onload = () => { ctx.drawImage(img, cx, cy, TILE_SIZE, TILE_SIZE); URL.revokeObjectURL(u); resolve(); };
              img.onerror = () => { URL.revokeObjectURL(u); resolve(); };
              img.src = u;
            }))
            .catch(() => {})
        );
      }
    }
    await Promise.all(tilePromises);

    // Draw cell outlines using direct projection
    cells.filter(c => c.visible !== false).forEach(cell => {
      let points;
      try { points = JSON.parse(cell.points); } catch { return; }
      if (!points || points.length < 2) return;
      const pts = points.map(p => {
        const px = L.CRS.EPSG3857.latLngToPoint(L.latLng(p.lat, p.lng), zoom);
        return { x: px.x - originX, y: px.y - originY };
      });
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(99,102,241,1)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(99,102,241,0.15)';
      ctx.fill();
    });

    return canvas;
  }

  async function handleDownloadPDF() {
    setLoading(true);
    const canvas = await buildMapCanvas();
    const { default: jsPDF } = await import('jspdf');

    const pageW = 297;
    const pageH = 210;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const imgRatio = canvas.width / canvas.height;
    const imgH = Math.min(pageH, pageW / imgRatio);
    const imgW = imgH * imgRatio;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, 0, imgW, imgH);

    if (cells.length > 0) {
      const boxX = 6;
      const boxY = 6;
      const rowH = 9;
      const boxW = 130;
      const boxH = 16 + cells.slice(0, 8).length * rowH + 6;

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 95);
      pdf.text('Cell Summary', boxX + 4, boxY + 8);

      const colX = [boxX + 4, boxX + 48, boxX + 80, boxX + 105];
      const headers = ['Cell Name', 'Adopted (mi)', 'Unadopted (mi)', 'Total (mi)'];
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 100, 100);
      headers.forEach((h, i) => pdf.text(h, colX[i], boxY + 15));

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
    const canvas = await buildMapCanvas();
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