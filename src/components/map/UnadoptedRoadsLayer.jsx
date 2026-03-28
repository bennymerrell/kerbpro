import { Polyline } from 'react-leaflet';

export default function UnadoptedRoadsLayer({ roads }) {
  if (!roads || roads.length === 0) return null;
  return (
    <>
      {roads.map((positions, i) => (
        <Polyline
          key={i}
          positions={positions}
          pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.85 }}
        />
      ))}
    </>
  );
}