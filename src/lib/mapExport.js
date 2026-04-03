import L from 'leaflet';
import { base44 } from '@/api/base44Client';

export async function buildMapCanvas(cells = [], selectedCell = null, overrideOrientation = null, overrideZoom = null, overrideCenter = null, overlayPixels = null) {
  // Determine orientation first to set canvas dimensions
  const pdfDims = getPDFDimensions(cells, selectedCell);
  const isPortrait = (overrideOrientation || pdfDims.orientation) === 'portrait';
  // Use overlay pixel size scaled up 2x for quality, so we capture EXACTLY what the overlay shows
  const SCALE = 2;
  const CANVAS_W = overlayPixels ? Math.round(overlayPixels.width * SCALE) : (isPortrait ? 990 : 1400);
  const CANVAS_H = overlayPixels ? Math.round(overlayPixels.height * SCALE) : (isPortrait ? 1400 : 990);
  const TILE_SIZE = 256;

  let center, zoom;

  if (overrideCenter && overrideZoom !== null) {
    // Use exactly what the live map is showing
    center = L.latLng(overrideCenter.lat, overrideCenter.lng);
    zoom = overrideZoom;
  } else {
    // Fall back to auto-fit from cell bounds
    let pointsToUse = [];
    if (selectedCell) {
      try { pointsToUse = JSON.parse(selectedCell.points) || []; } catch {}
    } else {
      pointsToUse = cells.filter(c => c.visible !== false).flatMap(c => {
        try { return JSON.parse(c.points); } catch { return []; }
      });
    }

    if (pointsToUse.length > 0) {
      const lats = pointsToUse.map(p => p.lat);
      const lngs = pointsToUse.map(p => p.lng);
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
      center = bounds.getCenter();
      zoom = overrideZoom !== null ? overrideZoom : 18;
    } else {
      center = L.latLng(51.505, -1.27);
      zoom = overrideZoom !== null ? overrideZoom : 13;
    }
  }

  // Use fractional zoom for pixel math, integer zoom for tile URLs
  const tileZoom = Math.min(Math.round(zoom), 19);
  const scaleFactor = Math.pow(2, zoom - tileZoom);

  // captureW/H = the CSS pixel size of the overlay (the actual area to capture)
  // CANVAS is SCALE x larger for output quality only — it does NOT capture more area
  const captureW = overlayPixels ? overlayPixels.width : CANVAS_W / SCALE;
  const captureH = overlayPixels ? overlayPixels.height : CANVAS_H / SCALE;

  const centerPx = L.CRS.EPSG3857.latLngToPoint(center, zoom);
  const originX = centerPx.x - captureW / 2;
  const originY = centerPx.y - captureH / 2;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8e0d8';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Tile size in capture coords (CSS px), drawn scaled up to canvas coords
  const scaledTileSize = TILE_SIZE * scaleFactor; // in capture px
  const drawTileSize = scaledTileSize * SCALE;     // in canvas px

  const tX0 = Math.floor(originX / scaledTileSize);
  const tY0 = Math.floor(originY / scaledTileSize);
  const tX1 = Math.ceil((originX + captureW) / scaledTileSize);
  const tY1 = Math.ceil((originY + captureH) / scaledTileSize);

  const tileTasks = [];
  for (let tx = tX0; tx <= tX1; tx++) {
    for (let ty = tY0; ty <= tY1; ty++) {
      const cx = (tx * scaledTileSize - originX) * SCALE;
      const cy = (ty * scaledTileSize - originY) * SCALE;
      tileTasks.push({ z: tileZoom, x: tx, y: ty, cx, cy });
    }
  }

  // Fetch in small batches to avoid rate limiting
  const BATCH_SIZE = 4;
  for (let i = 0; i < tileTasks.length; i += BATCH_SIZE) {
    const batch = tileTasks.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(({ z, x, y, cx, cy }) =>
      base44.functions.invoke('osmTileProxy', { z, x, y })
        .then(res => new Promise(resolve => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, cx, cy, drawTileSize, drawTileSize); resolve(); };
          img.onerror = () => resolve();
          img.src = `data:image/png;base64,${res.data.base64}`;
        }))
        .catch(() => {})
    ));
    if (i + BATCH_SIZE < tileTasks.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  // Draw cell outlines using Leaflet's own projection at the same zoom
  const cellsToDraw = selectedCell ? [selectedCell] : cells.filter(c => c.visible !== false);
  cellsToDraw.forEach(cell => {
    let points;
    try { points = JSON.parse(cell.points); } catch { return; }
    if (!points || points.length < 2) return;

    const pts = points.map(p => {
      const px = L.CRS.EPSG3857.latLngToPoint(L.latLng(p.lat, p.lng), zoom);
      return { x: (px.x - originX) * SCALE, y: (px.y - originY) * SCALE };
    });

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.strokeStyle = 'rgba(99, 102, 241, 1)';
    ctx.lineWidth = 5;
    ctx.stroke();
  });

  return canvas;
}

// Determine optimal PDF dimensions based on cell aspect ratio
export function getPDFDimensions(cells = [], selectedCell = null) {
  let pointsToUse = [];
  if (selectedCell) {
    try {
      pointsToUse = JSON.parse(selectedCell.points) || [];
    } catch {}
  } else {
    pointsToUse = cells.filter(c => c.visible !== false).flatMap(c => {
      try { return JSON.parse(c.points); } catch { return []; }
    });
  }

  if (pointsToUse.length < 2) {
    return { orientation: 'landscape', width: 297, height: 210 };
  }

  const lats = pointsToUse.map(p => p.lat);
  const lngs = pointsToUse.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  
  const isWider = lngSpan > latSpan;
  
  if (isWider) {
    return { orientation: 'landscape', width: 297, height: 210 };
  } else {
    return { orientation: 'portrait', width: 210, height: 297 };
  }
}

// Calculate optimal image dimensions to maximize fill while maintaining aspect ratio
export function calculateOptimalImageDimensions(canvasWidth, canvasHeight, pageWidth, pageHeight) {
  const canvasAspect = canvasWidth / canvasHeight;
  const pageAspect = pageWidth / pageHeight;

  let imgWidth, imgHeight;

  if (canvasAspect > pageAspect) {
    imgWidth = pageWidth;
    imgHeight = pageWidth / canvasAspect;
  } else {
    imgHeight = pageHeight;
    imgWidth = pageHeight * canvasAspect;
  }

  const x = (pageWidth - imgWidth) / 2;
  const y = (pageHeight - imgHeight) / 2;

  return { x, y, width: imgWidth, height: imgHeight };
}