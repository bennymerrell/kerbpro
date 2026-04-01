import { useState, useCallback, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { indexedDBCache } from '@/lib/indexedDBCache';
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
import { List, Settings, SquareDashedBottom, ChevronDown, Info, Shapes, MousePointerClick, FlaskConical } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [waypoints, setWaypoints] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);

  // On mount, load saved default location then try geolocation
  useEffect(() => {
    base44.entities.AppSettings.list().then((records) => {
      if (!location.state?.flyTo && records.length > 0 && records[0].default_lat && records[0].default_lng) {
        setMapCenter([records[0].default_lat, records[0].default_lng]);
        if (records[0].default_zoom) mapRef.current?.setZoom(records[0].default_zoom);
      }
    });
    if (!location.state?.flyTo) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const latlng = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(latlng);
          if (mapRef.current) {
            mapRef.current.flyTo(latlng, mapRef.current.getZoom(), { animate: false });
          }
        },
        () => {}
      );
    }
  }, []);
  const [isPlotting, setIsPlotting] = useState(false);
  const [tileLayer, setTileLayer] = useState('osm');
  const [isSpeciesMode, setIsSpeciesMode] = useState(false);
  const [speciesModalLocation, setSpeciesModalLocation] = useState(null);
  const [speciesSightings, setSpeciesSightings] = useState([]);

  useEffect(() => {
    const loadSightings = async () => {
      try {
        const records = await base44.entities.Sighting.list('-created_date', 200);
        const mapped = records.map(r => ({
          lat: r.lat,
          lng: r.lng,
          species: r.species,
          notes: r.notes,
          photoUrl: r.photo_url,
          id: r.id,
        }));
        setSpeciesSightings(mapped);
        await indexedDBCache.cacheSightings(records);
      } catch (e) {
        const cached = await indexedDBCache.getSightings();
        setSpeciesSightings(cached.map(r => ({
          lat: r.lat,
          lng: r.lng,
          species: r.species,
          notes: r.notes,
          photoUrl: r.photo_url,
          id: r.id,
        })));
      }
    };
    loadSightings();
  }, []);
  const [isAreaMode, setIsAreaMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [areaClosed, setAreaClosed] = useState(false);
  const [savedCells, setSavedCells] = useState([]);

  useEffect(() => {
    const loadCells = async () => {
      try {
        const data = await base44.entities.Cell.list('-created_date', 100);
        setSavedCells(data);
        await indexedDBCache.cacheCells(data);
      } catch (e) {
        const cached = await indexedDBCache.getCells();
        setSavedCells(cached);
      }
    };
    loadCells();
  }, []);

  useEffect(() => {
    if (location.state?.selectedCell) {
      setSelectedCell(location.state.selectedCell);
    }
  }, [location.state?.selectedCell]);

  useEffect(() => {
    if (!location.state?.flyTo) return;
    if (location.state?.activateCategory) {
      setActiveCategories(prev => prev.includes(location.state.activateCategory) ? prev : [...prev, location.state.activateCategory]);
    }
    const coords = location.state.flyTo;
    const attempt = (tries = 0) => {
      if (mapRef.current) {
        mapRef.current.setView(coords, 19, { animate: false });
      } else if (tries < 20) {
        setTimeout(() => attempt(tries + 1), 100);
      }
    };
    attempt();
  }, [location.state?.flyTo]);

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
    await indexedDBCache.cacheCell(newCell);
    setAreaPoints([]);
    setAreaClosed(false);
    setIsAreaMode(false);
    setUnadoptedRoads([]);
  }

  async function handleToggleCell(cell) {
    const updated = await base44.entities.Cell.update(cell.id, { visible: !cell.visible });
    const updatedCell = { ...cell, visible: !cell.visible };
    setSavedCells(prev => prev.map(c => c.id === cell.id ? updatedCell : c));
    await indexedDBCache.cacheCell(updatedCell);
  }

  async function handleDeleteCell(cell) {
    await base44.entities.Cell.delete(cell.id);
    setSavedCells(prev => prev.filter(c => c.id !== cell.id));
    const cached = await indexedDBCache.getCells();
    await indexedDBCache.cacheCells(cached.filter(c => c.id !== cell.id));
  }
  const CATEGORIES = ['Species', 'Parking', 'Hydrant', 'Map Support', 'Public Toilet', 'Cafe'];
  const [activeCategories, setActiveCategories] = useState([]);
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
    <div className="fixed inset-0 w-screen h-screen relative overflow-hidden">
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
      <div className="absolute top-4 left-[70px] right-[70px] md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-[40%] z-[999] flex items-center">
        <SearchBox onLocationFound={handleLocationFound} />
      </div>

      {/* Desktop Toolbar — hidden on mobile */}
      <div className="hidden md:block">
        <MapToolbar
          isPlotting={isPlotting}
          onTogglePlotting={() => { setIsPlotting(!isPlotting); setIsSpeciesMode(false); }}
          onUndo={handleUndo}
          onClear={handleClear}
          waypointCount={waypoints.length}
          isSpeciesMode={isSpeciesMode}
          onToggleSpeciesMode={() => { setIsSpeciesMode(!isSpeciesMode); setIsPlotting(false); setIsAreaMode(false); }}
          isAreaMode={isAreaMode}
          onToggleAreaMode={() => { setIsAreaMode(!isAreaMode); setIsPlotting(false); setIsSpeciesMode(false); setAreaPoints([]); setAreaClosed(false); setSelectedCell(null); navigate('/'); }}
          cells={savedCells}
          selectedCell={selectedCell}
        />
      </div>



      {/* Tile selector — desktop only */}
      <div className="hidden md:block"><TileLayerSelector currentLayer={tileLayer} onChangeLayer={setTileLayer} /></div>
      {/* Distance info — desktop only */}
      <div className="hidden md:block"><DistancePanel waypoints={waypoints} /></div>

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
            <div className="bg-muted/60 rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Total roads</span>
              <span className="text-xs font-bold text-foreground">{((location.state.cellMileage.adopted_m + location.state.cellMileage.unadopted_m) / 1609.34).toFixed(2)} mi</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter — desktop only */}
      <div className="hidden md:block"><CategoryFilter activeCategories={activeCategories} onChange={setActiveCategories} /></div>

      {/* Nav dropdown — desktop only */}
      <div className="hidden md:block">
        <div className="absolute top-4 right-28 z-[1000]">
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
                <button onClick={() => { setNavOpen(false); navigate('/chemical-logs'); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
                  <FlaskConical className="h-3.5 w-3.5" /> Chemical Logs
                </button>
                <div className="h-px bg-border/50" />
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
                </div>

                {/* Mobile Burger Menu */}
      <div className="absolute top-4 left-4 z-[1000] md:hidden">
          <div className="relative">
            <button
              onClick={() => setNavOpen(o => !o)}
              className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 text-foreground hover:bg-muted/80 transition-all"
            >
              <List className="h-5 w-5" />
            </button>
            {navOpen && (
              <div className="absolute top-full left-0 mt-1 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 overflow-hidden min-w-[160px]">
                {/* Map Controls */}
                <button
                  onClick={() => { setIsSpeciesMode(!isSpeciesMode); setIsPlotting(false); setIsAreaMode(false); setNavOpen(false); }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                    isSpeciesMode ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Info className="h-3.5 w-3.5" /> Spotted
                </button>
                <button
                  onClick={() => { setIsAreaMode(!isAreaMode); setIsPlotting(false); setIsSpeciesMode(false); setAreaPoints([]); setAreaClosed(false); setNavOpen(false); navigate('/'); }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                    isAreaMode ? 'bg-indigo-600/20 text-indigo-600' : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Shapes className="h-3.5 w-3.5" /> Draw Cell
                </button>
                <button
                  onClick={() => { setIsPlotting(!isPlotting); setIsSpeciesMode(false); setIsAreaMode(false); setNavOpen(false); }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                    isPlotting ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <MousePointerClick className="h-3.5 w-3.5" /> Plot Route
                </button>

                <div className="h-px bg-border/50" />

                {/* Pages */}
                <button onClick={() => { setNavOpen(false); navigate('/chemical-logs'); }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
                  <FlaskConical className="h-3.5 w-3.5" /> Chemical Logs
                </button>
                <div className="h-px bg-border/50" />
                <button onClick={() => { setNavOpen(false); navigate('/sightings'); }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
                  <List className="h-3.5 w-3.5" /> Sightings
                </button>
                <button onClick={() => { setNavOpen(false); navigate('/cells'); }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
                  <SquareDashedBottom className="h-3.5 w-3.5" /> Cells
                </button>

                <div className="h-px bg-border/50" />

                {/* Categories */}
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase">Sightings Filter</div>
                    <button
                      onClick={() => setActiveCategories(activeCategories.length === CATEGORIES.length ? [] : [...CATEGORIES])}
                      className="text-[10px] text-primary font-medium hover:underline"
                    >
                      {activeCategories.length === CATEGORIES.length ? 'Hide all' : 'Show all'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {CATEGORIES.map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeCategories.includes(cat)}
                          onChange={() => {
                            if (activeCategories.includes(cat)) {
                              setActiveCategories(activeCategories.filter(c => c !== cat));
                            } else {
                              setActiveCategories([...activeCategories, cat]);
                            }
                          }}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs text-foreground">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Zoom controls — desktop only */}
      <div className="hidden md:block"><div className="absolute right-4 z-[1000]" style={{bottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))'}}><div className="bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 flex flex-col overflow-hidden">
          <button onClick={() => mapRef.current?.zoomIn()} className="px-3 py-2 text-foreground hover:bg-muted/60 transition-colors text-lg font-medium">+</button>
          <div className="h-px bg-border/50" />
          <button onClick={() => mapRef.current?.zoomOut()} className="px-3 py-2 text-foreground hover:bg-muted/60 transition-colors text-lg font-medium">−</button>
        </div>
      </div></div>

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
              reported_by: currentUser?.full_name || currentUser?.email || null,
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