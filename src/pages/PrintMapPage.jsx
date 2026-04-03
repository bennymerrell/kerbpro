import { useState, useEffect, useRef } from 'react';
import { buildMapCanvas, getPDFDimensions, calculateOptimalImageDimensions } from '../lib/mapExport';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import PrintMapControls from '../components/PrintMapControls';
import PrintPreviewOverlay from '../components/PrintPreviewOverlay';

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
  const [generating, setGenerating] = useState(false);
  const mapContainerRef = useRef(null);
  const overlayRef = useRef(null);

  async function handleGeneratePDF() {
    if (!selectedCell || !mapContainerRef.current || !overlayRef.current) return;
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      // Get the pixel bounds of the overlay relative to the map container
      const mapRect = mapContainerRef.current.getBoundingClientRect();
      const overlayRect = overlayRef.current.getBoundingClientRect();
      const cropX = overlayRect.left - mapRect.left;
      const cropY = overlayRect.top - mapRect.top;
      const cropW = overlayRect.width;
      const cropH = overlayRect.height;

      // Capture only the map container (no UI chrome)
      const fullCanvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false,
      });

      // Crop to the overlay region
      const scale = fullCanvas.width / mapRect.width;
      const cropped = document.createElement('canvas');
      cropped.width = cropW * scale;
      cropped.height = cropH * scale;
      cropped.getContext('2d').drawImage(
        fullCanvas,
        cropX * scale, cropY * scale, cropW * scale, cropH * scale,
        0, 0, cropped.width, cropped.height
      );

      const isPortrait = orientation === 'portrait';
      const pageW = isPortrait ? 210 : 297;
      const pageH = isPortrait ? 297 : 210;
      const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      pdf.addImage(cropped.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, pageH);
      const cellName = selectedCell?.name || 'map';
      pdf.save(`${cellName}-${orientation}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

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
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-card border-b border-border p-4 flex items-center justify-between print:!hidden">
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
      <div ref={mapContainerRef} className="absolute inset-0 top-16 bottom-24">
        {selectedCell ? (
          <>
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
            <PrintPreviewOverlay ref={overlayRef} orientation={orientation} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No cell selected</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <PrintMapControls
        zoom={zoom}
        onZoomChange={setZoom}
        orientation={orientation}
        onOrientationChange={setOrientation}
        onPrint={handleGeneratePDF}
        generating={generating}
      />
    </div>
  );
}