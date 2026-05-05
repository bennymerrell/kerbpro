import { Polygon, Tooltip } from 'react-leaflet';

const STATUS_COLORS = {
  completed:   { color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.2, weight: 2 },
  in_progress: { color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.2, weight: 2 },
  not_started: { color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 2 },
};

export default function SavedCellsLayer({ cells, userRole, activeUserCell, onCellClick, locked = false }) {
  return cells
    .filter(c => c.visible !== false)
    .map((cell, i) => {
      let points = [];
      try { points = JSON.parse(cell.points); } catch { return null; }
      const positions = points.map(p => [p.lat, p.lng]);
      const pathOptions = STATUS_COLORS[cell.work_status] || STATUS_COLORS.not_started;
      const isActiveCell = activeUserCell && cell.id === activeUserCell.id;
      const clickable = !locked && onCellClick && (cell.work_status !== 'completed' || isActiveCell);
      return (
        <Polygon
          key={cell.id || i}
          positions={positions}
          pathOptions={pathOptions}
          eventHandlers={clickable ? { click: () => onCellClick(cell) } : undefined}
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