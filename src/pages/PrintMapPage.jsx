import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import PrintMapControls from '../components/PrintMapControls';

function MapContent({ selectedCell, zoom, setZoom }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedCell) return;

    try {
      const points = JSON.parse(selectedCell.points);
      if (points && points.length > 0) {
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        const bounds = L.latLngBounds(
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (e) {
      console.error('Error parsing points:', e);
    }
  }, [selectedCell, map]);

  useEffect(() => {
    map.setZoom(zoom);
  }, [zoom, map]);

  if (!selectedCell) return null;

  try {
    const points = JSON.parse(selectedCell.points);
    const coordinates = points.map(p => [p.lat, p.lng]);

    return (
      <Polygon
        positions={coordinates}
        pathOptions={{
          color: 'rgba(99, 102, 241, 1)',
          weight: 5,
          opacity: 0.9,
          fill: true,
          fillColor: 'rgba(99, 102, 241, 0.1)',
          fillOpacity: 0.2
        }}
      />
    );
  } catch {
    return null;
  }
}

export default function PrintMapPage() {
  const { cellId } = useParams();
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState(null);
  const [zoom, setZoom] = useState(18.0);
  const [orientation, setOrientation] = useState('portrait');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCell() {
      if (!cellId) {
        setLoading(false);
        return;
      }
      try {
        const cell = await base44.entities.Cell.get(cellId);
        setSelectedCell(cell);
      } catch (e) {
        console.error('Error fetching cell:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCell();
  }, [cellId]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-background print:bg-white ${orientation === 'landscape' ? 'print:aspect-video' : ''}`}>
      {/* Header - Hidden on print */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-card border-b border-border p-4 flex items-center justify-between print:hidden">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            Print Map {selectedCell?.name ? `- ${selectedCell.name}` : ''}
          </h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 top-16 bottom-24 print:inset-0 print:top-0 print:bottom-0">
        {selectedCell ? (
          <MapContainer
            center={[51.505, -0.09]}
            zoom={zoom}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
            <MapContent selectedCell={selectedCell} zoom={zoom} setZoom={setZoom} />
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No cell selected</p>
          </div>
        )}
      </div>

      {/* Controls - Hidden on print */}
      <PrintMapControls
        zoom={zoom}
        onZoomChange={setZoom}
        orientation={orientation}
        onOrientationChange={setOrientation}
        onPrint={() => window.print()}
      />
    </div>
  );
}