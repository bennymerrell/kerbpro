import { Polygon, Tooltip } from 'react-leaflet';

const STATUS_COLORS = {
  completed:   { color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.2, weight: 2 },
  in_progress: { color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.2, weight: 2 },
  not_started: { color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 2 },
};

const DEFAULT_STYLE = { color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 2 };

export default function SavedCellsLayer({ cells, userRole }) {
  const isAdmin = userRole === 'admin' || userRole === 'manager';
  return cells
    .filter(c => c.visible !== false)
    .map((cell, i) => {
      let points = [];
      try { points = JSON.parse(cell.points); } catch { return null; }
      const positions = points.map(p => [p.lat, p.lng]);
      const pathOptions = isAdmin ? (STATUS_COLORS[cell.work_status] || STATUS_COLORS.not_started) : DEFAULT_STYLE;
      return (
        <Polygon
          key={cell.id || i}
          positions={positions}
          pathOptions={pathOptions}
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