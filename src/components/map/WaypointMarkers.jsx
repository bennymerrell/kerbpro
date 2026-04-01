import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatDistance, formatDistanceMiles, getSegmentDistances, calculateTotalDistance } from '../../lib/mapUtils';

function createWaypointIcon(index, total) {
  let className = 'waypoint-marker';
  if (index === 0) className += ' start';
  else if (index === total - 1 && total > 1) className += ' end';

  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="${className}">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}



export default function WaypointMarkers({ waypoints, onRemoveWaypoint }) {
  const segments = getSegmentDistances(waypoints);

  return waypoints.map((wp, i) => {
    const cumulativeDistance = segments.slice(0, i).reduce((a, b) => a + b, 0);

    return (
      <Marker
        key={`wp-${i}-${wp.lat}-${wp.lng}`}
        position={[wp.lat, wp.lng]}
        icon={createWaypointIcon(i, waypoints.length)}
      >
        <Popup className="custom-popup" closeButton={false}>
          <div className="font-sans text-sm p-1">
            <div className="font-semibold text-foreground mb-1">
              Point {i + 1}
              {i === 0 && <span className="ml-1.5 text-xs text-emerald-600 font-medium">Start</span>}
              {i === waypoints.length - 1 && waypoints.length > 1 && (
                <span className="ml-1.5 text-xs text-red-500 font-medium">End</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>{wp.lat.toFixed(6)}, {wp.lng.toFixed(6)}</div>
              {i > 0 && (
                <>
                  <div>Leg: {formatDistance(segments[i - 1])} / {formatDistanceMiles(segments[i - 1])}</div>
                  <div>Total: {formatDistance(cumulativeDistance)} / {formatDistanceMiles(cumulativeDistance)}</div>
                </>
              )}
            </div>
            <button
              onClick={() => onRemoveWaypoint(i)}
              className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Remove point
            </button>
          </div>
        </Popup>
      </Marker>
    );
  });
}