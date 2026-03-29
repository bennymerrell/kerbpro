import { useState, useCallback, useRef, useEffect } from 'react';
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
import SavedCellsLayer from '../components/map/SavedCellsLayer';
import UnadoptedRoadsLayer from '../components/map/UnadoptedRoadsLayer';
import ExportPanel from '../components/map/ExportPanel';
import MobileToolbar from '../components/map/MobileToolbar';
import LocateButton from '../components/map/LocateButton';
import CategoryFilter from '../components/map/CategoryFilter';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { List, Settings, SquareDashedBottom, ChevronDown } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

// Fix leaflet default marker icon
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [51.505, -1.27]; // UK fallback
const DEFAULT_ZOOM = 13;

export default function MapPage() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [waypoints, setWaypoints] = useState([]);

  // On mount, load saved default location then try geolocation
  useEffect(() => {
    base44.entities.AppSettings.list().then((records) => {
      if (records.length > 0 && records[0].default_lat && records[0].default_lng) {
        setMapCenter([records[0].default_lat, records[0].default_lng]);
        if (records[0].default_zoom) mapRef.current?.setZoom(records[0].default_zoom);
      }
    });
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);
  const [isPlotting, setIsPlotting] = useState(true);
  const [tileLayer, setTileLayer] = useState('osm');
  const [isSpeciesMode, setIsSpeciesMode] = useState(false);
  const [speciesModalLocation, setSpeciesModalLocation] = useState(null);
  const [speciesSightings, setSpeciesSightings] = useState([]);

  useEffect(() => {
    base44.entities.Sighting.list('-created_date', 200).then((records) => {
      setSpeciesSightings(records.map(r => ({
        lat: r.lat,
        lng: r.lng,
        species: r.species,
        notes: r.notes,
        photoUrl: r.photo_url,
        id: r.id,
      })));
    });
  }, []);
  const [isAreaMode, setIsAreaMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [areaClosed, setAreaClosed] = useState(false);
  const [savedCells, setSavedCells] = useState([]);

  useEffect(() => {
    base44.entities.Cell.list('-created_date', 100).then(setSavedCells);
  }, []);

  useEffect(() => {
    if (!location.state?.fitBounds) return;
    const bounds = location.state.fitBounds;
    const attempt = (tries = 0) => {
      if (mapRef.current) {
        // Check if bounds span is too small (1-2 point cells)
        const lats = bounds.map(b => b[0]);
        const lngs = bounds.map(b => b[1]);
        const latSpan = Math.max(...lats) - Math.min(...lats);
        const lngSpan = Math.max(...lngs) - Math.min(...lngs);
        if (latSpan < 0.0001 && lngSpan < 0.0001) {
          const center = [lats.reduce((a,b)=>a+b,0)/lats.length, lngs.reduce((a,b)=>a+b,0)/lngs.length];
          mapRef.current.flyTo(center, 16, { animate: true });
        } else {
          mapRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
        }
      } else if (tries < 20) {
        setTimeout(() => attempt(tries + 1), 100);
      }
    };
    attempt();
  }, [location.state]);

  async function handleSaveCell(name, area, mileage) {
    const newCell = await base44.entities.Cell.create({
      name,
      points: JSON.stringify(areaPoints),
      visible: true,
      area: area || '',
      adopted_m: mileage?.adoptedM ?? null,
      unadopted_m: mileage?.unadoptedM ?? null,
    });
    setSavedCells(prev => [newCell, ...prev]);
    setAreaPoints([]);
    setAreaClosed(false);
    setIsAreaMode(false);
    setUnadoptedRoads([]);
  }

  async function handleToggleCell(cell) {
    const updated = await base44.entities.Cell.update(cell.id, { visible: !cell.visible });
    setSavedCells(prev => prev.map(c => c.id === cell.id ? { ...c, visible: !cell.visible } : c));
  }

  async function handleDeleteCell(cell) {
    await base44.entities.Cell.delete(cell.id);
    setSavedCells(prev => prev.filter(c => c.id !== cell.id));
  }
  const CATEGORIES = ['Species', 'Parking', 'Hydrant', 'Map Support', 'Public Toilet', 'Cafe'];
  const [activeCategories, setActiveCategories] = useState(CATEGORIES);
  const [unadoptedRoads, setUnadoptedRoads] = useState([]);
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
        center={mapCenter}
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
        <SpeciesMarkers
          sightings={speciesSightings.filter(s => {
            const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
            return activeCategories.includes(cat);
          })}
          onRemove={(i) => {
            // find index in full array
            const visible = speciesSightings.filter(s => {
              const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
              return activeCategories.includes(cat);
            });
            const target = visible[i];
            setSpeciesSightings(prev => prev.filter(s => s !== target));
          }}
        />
        <LocateButton />
        <UnadoptedRoadsLayer roads={unadoptedRoads} />
        <SavedCellsLayer cells={savedCells} />
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

      {/* Desktop Toolbar — hidden on mobile/tablet */}
      {!isMobile && (
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
      )}

      {/* Mobile Toolbar */}
      <MobileToolbar
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
          onClearArea={() => { setAreaPoints([]); setAreaClosed(false); setUnadoptedRoads([]); }}
          onUnadoptedRoads={setUnadoptedRoads}
          onSaveCell={handleSaveCell}
        />
      )}

      {/* Saved cell mileage popup (when returning from CellsPage) */}
      {location.state?.cellMileage && (
        <div className="absolute bottom-6 left-4 z-[1000] w-72">
          <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-3 space-y-2">
            <div className="text-xs font-semibold text-foreground mb-1">{location.state.cellName || 'Cell'} — Road Mileage</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-2.5">
                <div className="text-[10px] text-blue-600 font-medium mb-0.5">Adopted Roads</div>
                <div className="text-sm font-bold text-blue-800">{(location.state.cellMileage.adopted_m / 1609.34).toFixed(2)} mi</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2.5">
                <div className="text-[10px] text-red-600 font-medium mb-0.5">Unadopted Roads</div>
                <div className="text-sm font-bold text-red-800">{(location.state.cellMileage.unadopted_m / 1609.34).toFixed(2)} mi</div>
              </div>
            </div>
            <div className="bg-muted/60 rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Total roads</span>
              <span className="text-xs font-bold text-foreground">{((location.state.cellMileage.adopted_m + location.state.cellMileage.unadopted_m) / 1609.34).toFixed(2)} mi</span>
            </div>
          </div>
        </div>
      )}

      <CategoryFilter activeCategories={activeCategories} onChange={setActiveCategories} />


      {/* Settings link */}
      <div className="absolute top-4 right-44 z-[1000]">
        <Link
          to="/settings"
          className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-all"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>

      {/* Nav dropdown */}
      <div className="absolute top-4 right-14 z-[1000]">
        <div className="relative">
          <button
            onClick={() => setNavOpen(o => !o)}
            className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-all"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {navOpen && (
            <div className="absolute top-full right-0 mt-1 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 overflow-hidden min-w-[130px]">
              <button onClick={() => { setNavOpen(false); navigate('/sightings'); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
                <List className="h-3.5 w-3.5" /> Sightings
              </button>
              <div className="h-px bg-border/50" />
              <button onClick={() => { setNavOpen(false); navigate('/cells'); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
                <SquareDashedBottom className="h-3.5 w-3.5" /> Cells
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export — desktop only, mobile has it in toolbar */}
      {!isMobile && <ExportPanel />}

      {/* Zoom controls — desktop only */}
      {!isMobile && <div className="absolute bottom-8 right-4 z-[1000]" style={{bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))'}}>        <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 flex flex-col overflow-hidden">
          <button onClick={() => mapRef.current?.zoomIn()} className="px-3 py-2 text-foreground hover:bg-muted/60 transition-colors text-lg font-medium">+</button>
          <div className="h-px bg-border/50" />
          <button onClick={() => mapRef.current?.zoomOut()} className="px-3 py-2 text-foreground hover:bg-muted/60 transition-colors text-lg font-medium">−</button>
        </div>
      </div>}

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
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 flex-wrap justify-center px-4" style={{bottom: 'max(9rem, calc(env(safe-area-inset-bottom) + 8rem))'}}>        
          <div className="bg-indigo-600/90 backdrop-blur-md rounded-full shadow-lg px-5 py-2.5 text-xs text-white font-medium">
            {areaPoints.length < 3
              ? `Click to place points (${areaPoints.length} placed, need at least 3)`
              : `${areaPoints.length} points placed — cell`}
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
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000]" style={{bottom: 'max(9rem, calc(env(safe-area-inset-bottom) + 8rem))'}}>
          <div className="bg-primary/90 backdrop-blur-md rounded-full shadow-lg px-5 py-2.5 text-xs text-white font-medium">
            ℹ️ Click anywhere to add a sighting
          </div>
        </div>
      )}
      {!isSpeciesMode && !isAreaMode && isPlotting && waypoints.length === 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000]" style={{bottom: 'max(9rem, calc(env(safe-area-inset-bottom) + 4rem))'}}>
          <div className="bg-card/95 backdrop-blur-md rounded-full shadow-lg border border-border/50 px-5 py-2.5 text-xs text-muted-foreground font-medium">
            Click on the map to start plotting your route
          </div>
        </div>
      )}
    </div>
  );
}