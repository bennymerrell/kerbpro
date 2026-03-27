import { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_LAYERS } from '../lib/mapUtils';
import MapClickHandler from '../components/map/MapClickHandler';
import WaypointMarkers from '../components/map/WaypointMarkers';
import RouteLine from '../components/map/RouteLine';
import MapToolbar from '../components/map/MapToolbar';
import TileLayerSelector from '../components/map/TileLayerSelector';
import DistancePanel from '../components/map/DistancePanel';
import SearchBox from '../components/map/SearchBox';

// Fix leaflet default marker icon
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [51.505, -1.27]; // UK center
const DEFAULT_ZOOM = 13;

export default function MapPage() {
  const [waypoints, setWaypoints] = useState([]);
  const [isPlotting, setIsPlotting] = useState(true);
  const [tileLayer, setTileLayer] = useState('osm');
  const mapRef = useRef(null);

  const handleMapClick = useCallback((latlng) => {
    setWaypoints(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
  }, []);

  const handleUndo = useCallback(() => {
    setWaypoints(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setWaypoints([]);
  }, []);

  const handleRemoveWaypoint = useCallback((index) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleLocationFound = useCallback((location) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo([location.lat, location.lng], 16, { duration: 1.5 });
    }
  }, []);

  const currentTile = TILE_LAYERS[tileLayer];

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        ref={mapRef}
        style={{ cursor: isPlotting ? 'crosshair' : 'grab' }}
      >
        <TileLayer
          key={tileLayer}
          attribution={currentTile.attribution}
          url={currentTile.url}
          maxZoom={currentTile.maxZoom}
        />
        <MapClickHandler onMapClick={handleMapClick} isActive={isPlotting} />
        <RouteLine waypoints={waypoints} />
        <WaypointMarkers waypoints={waypoints} onRemoveWaypoint={handleRemoveWaypoint} />
      </MapContainer>

      {/* Search */}
      <SearchBox onLocationFound={handleLocationFound} />

      {/* Toolbar */}
      <MapToolbar
        isPlotting={isPlotting}
        onTogglePlotting={() => setIsPlotting(!isPlotting)}
        onUndo={handleUndo}
        onClear={handleClear}
        waypointCount={waypoints.length}
      />

      {/* Tile selector */}
      <TileLayerSelector currentLayer={tileLayer} onChangeLayer={setTileLayer} />

      {/* Distance info */}
      <DistancePanel waypoints={waypoints} />

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-4 z-[1000]">
        <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 flex flex-col overflow-hidden">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="px-3 py-2 text-foreground hover:bg-muted/60 transition-colors text-lg font-medium"
          >
            +
          </button>
          <div className="h-px bg-border/50" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="px-3 py-2 text-foreground hover:bg-muted/60 transition-colors text-lg font-medium"
          >
            −
          </button>
        </div>
      </div>

      {/* Plotting hint */}
      {isPlotting && waypoints.length === 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-card/95 backdrop-blur-md rounded-full shadow-lg border border-border/50 px-5 py-2.5 text-xs text-muted-foreground font-medium">
            Click on the map to start plotting your route
          </div>
        </div>
      )}
    </div>
  );
}