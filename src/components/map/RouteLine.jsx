import { Polyline } from 'react-leaflet';

export default function RouteLine({ waypoints }) {
  if (waypoints.length < 2) return null;

  const positions = waypoints.map(wp => [wp.lat, wp.lng]);

  return (
    <>
      {/* Shadow line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#000',
          weight: 6,
          opacity: 0.15,
        }}
      />
      {/* Main route line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: 'hsl(210, 80%, 42%)',
          weight: 4,
          opacity: 0.85,
          dashArray: null,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  );
}