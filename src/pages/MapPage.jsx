import { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
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
import SpeciesModal from '../components/map/SpeciesModal';
import SpeciesMarkers from '../components/map/SpeciesMarkers';
import AreaDrawer from '../components/map/AreaDrawer';
import AreaResultsPanel from '../components/map/AreaResultsPanel';
import ExportPanel from '../components/map/ExportPanel';
import { Link } from 'react-router-dom';
import { List } from 'lucide-react';

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
  const [isSpeciesMode, setIsSpeciesMode] = useState(false);
  const [speciesModalLocation, setSpeciesModalLocation] = useState(null);
  const [speciesSightings, setSpeciesSightings] = useState([]);
  const [isAreaMode, setIsAreaMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [areaClosed, setAreaClosed] = useState(false);
  const mapRef = useRef(null);

  const handleMapClick = useCallback((latlng) => {
    if (isSpeciesMode) {
      setSpeciesModalLocation({ lat: latlng.lat, lng: latlng.lng });
    } else if (isAreaMode && !areaClosed) {
      setAreaPoints(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
    } else if (isPlotting) {
      setWaypoints(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
    }
  }, [isSpeciesMode, isAreaMode, areaClosed, isPlotting]);

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
        style={{ cursor: isPlotting || isSpeciesMode ? 'crosshair' : 'grab' }}
      >
        <TileLayer
          key={tileLayer}
          attribution={currentTile.attribution}
          url={currentTile.url}
          maxZoom={currentTile.maxZoom}
        />
        <MapClickHandler onMapClick={handleMapClick} isActive={isPlotting || isSpeciesMode || (isAreaMode && !areaClosed)} />
        <RouteLine waypoints={waypoints} />
        <WaypointMarkers waypoints={waypoints} onRemoveWaypoint={handleRemoveWaypoint} />
        <SpeciesMarkers sightings={speciesSightings} onRemove={(i) => setSpeciesSightings(prev => prev.filter((_, idx) => idx !== i))} />
        {isAreaMode && (
          <AreaDrawer
            points={areaPoints}
            closed={areaClosed}
            onClose={() => setAreaClosed(true)}
          />
        )}
      </MapContainer>

      {/* Search */}
      <SearchBox onLocationFound={handleLocationFound} />

      {/* Toolbar */}
      <MapToolbar
        isPlotting={isPlotting}
        onTogglePlotting={() => { setIsPlotting(!isPlotting); setIsSpeciesMode(false); }}
        onUndo={handleUndo}
        onClear={handleClear}
        waypointCount={waypoints.length}
        isSpeciesMode={isSpeciesMode}
        onToggleSpeciesMode={() => { setIsSpeciesMode(!isSpeciesMode); setIsPlotting(false); setIsAreaMode(false); }}
        isAreaMode={isAreaMode}
        onToggleAreaMode={() => { setIsAreaMode(!isAreaMode); setIsPlotting(false); setIsSpeciesMode(false); setAreaPoints([]); setAreaClosed(false); }}
      />

      {/* Tile selector */}
      <TileLayerSelector currentLayer={tileLayer} onChangeLayer={setTileLayer} />

      {/* Distance info */}
      <DistancePanel waypoints={waypoints} />

      {/* Area results */}
      {isAreaMode && (
        <AreaResultsPanel
          points={areaPoints}
          closed={areaClosed}
          onClearArea={() => { setAreaPoints([]); setAreaClosed(false); }}
        />
      )}

      {/* Sightings link */}
      <div className="absolute top-4 right-14 z-[1000]">
        <Link
          to="/sightings"
          className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-all"
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Sightings</span>
        </Link>
      </div>

      {/* Export */}
      <ExportPanel />

      {/* Zoom controls */}
      <div className="absolute bottom-8 right-4 z-[1000]" style={{bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))'}}>
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

      {/* Species Modal */}
      {speciesModalLocation && (
        <SpeciesModal
          location={speciesModalLocation}
          onClose={() => setSpeciesModalLocation(null)}
          onSaved={async (sighting) => {
            setSpeciesSightings(prev => [...prev, sighting]);
            await base44.entities.Sighting.create({
              species: sighting.species,
              notes: sighting.notes,
              lat: sighting.lat,
              lng: sighting.lng,
              photo_url: sighting.photoUrl || null,
            });
          }}
        />
      )}

      {/* Plotting hint */}
      {isAreaMode && !areaClosed && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 flex-wrap justify-center px-4" style={{bottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))'}}>        
          <div className="bg-indigo-600/90 backdrop-blur-md rounded-full shadow-lg px-5 py-2.5 text-xs text-white font-medium">
            {areaPoints.length < 3
              ? `Click to place points (${areaPoints.length} placed, need at least 3)`
              : `${areaPoints.length} points placed`}
          </div>
          {areaPoints.length >= 3 && (
            <button
              onClick={() => setAreaClosed(true)}
              className="bg-white text-indigo-700 font-semibold text-xs rounded-full shadow-lg px-4 py-2.5 hover:bg-indigo-50 transition-colors border border-indigo-200"
            >
              Close Shape ✓
            </button>
          )}
        </div>
      )}
      {isSpeciesMode && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000]" style={{bottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))'}}>
          <div className="bg-emerald-600/90 backdrop-blur-md rounded-full shadow-lg px-5 py-2.5 text-xs text-white font-medium">
            🌿 Click anywhere to record an invasive species sighting
          </div>
        </div>
      )}
      {!isSpeciesMode && !isAreaMode && isPlotting && waypoints.length === 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000]" style={{bottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))'}}>
          <div className="bg-card/95 backdrop-blur-md rounded-full shadow-lg border border-border/50 px-5 py-2.5 text-xs text-muted-foreground font-medium">
            Click on the map to start plotting your route
          </div>
        </div>
      )}
    </div>
  );
}