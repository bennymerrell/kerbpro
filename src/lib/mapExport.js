import L from 'leaflet';

export async function buildMapCanvas(cells = [], selectedCell = null) {
  const CANVAS_W = 1400;
  const CANVAS_H = 990;
  const TILE_SIZE = 256;

  // If a specific cell is selected, zoom to only that cell
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

  let center, zoom;
  if (pointsToUse.length > 0) {
    const lats = pointsToUse.map(p => p.lat);
    const lngs = pointsToUse.map(p => p.lng);
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
    center = bounds.getCenter();
    zoom = 18;
    for (let z = 18; z >= 1; z--) {
      const nw = L.CRS.EPSG3857.latLngToPoint(bounds.getNorthWest(), z);
      const se = L.CRS.EPSG3857.latLngToPoint(bounds.getSouthEast(), z);
      if (Math.abs(se.x - nw.x) <= CANVAS_W * 0.99 && Math.abs(se.y - nw.y) <= CANVAS_H * 0.99) {
        zoom = z;
        break;
      }
    }
  } else {
    center = L.latLng(51.505, -1.27);
    zoom = 13;
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

  // Detect tile layer from live map
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

  // Draw cell outlines using Leaflet's own projection at the same zoom
  const cellsToDraw = selectedCell ? [selectedCell] : cells.filter(c => c.visible !== false);
  cellsToDraw.forEach(cell => {
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