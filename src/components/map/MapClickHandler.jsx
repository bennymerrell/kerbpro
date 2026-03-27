import { useMapEvents } from 'react-leaflet';

export default function MapClickHandler({ onMapClick, isActive }) {
  useMapEvents({
    click(e) {
      if (isActive) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}