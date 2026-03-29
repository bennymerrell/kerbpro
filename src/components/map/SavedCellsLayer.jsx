import { Polygon, Tooltip } from 'react-leaflet';

export default function SavedCellsLayer({ cells }) {
  return cells
    .filter(c => c.visible !== false)
    .map((cell, i) => {
      let points = [];
      try { points = JSON.parse(cell.points); } catch { return null; }
      const positions = points.map(p => [p.lat, p.lng]);
      return (
        <Polygon
          key={cell.id || i}
          positions={positions}
          pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.15, weight: 2 }}
        >
          {cell.name && (
            <Tooltip permanent direction="center" className="cell-label">
              {cell.name}
            </Tooltip>
          )}
        </Polygon>
      );
    });
}