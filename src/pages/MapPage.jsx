import { useState, useCallback, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { indexedDBCache } from '@/lib/indexedDBCache';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_LAYERS, pointInPolygon } from '../lib/mapUtils';
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
import CellEditLayer from '../components/map/CellEditLayer';
import UnadoptedRoadsLayer from '../components/map/UnadoptedRoadsLayer';
import ExportPanel from '../components/map/ExportPanel';
import MobileToolbar from '../components/map/MobileToolbar';
import { LocateButton, LocationWatcher, LocationMarker } from '../components/map/LocateButton';
import CategoryFilter from '../components/map/CategoryFilter';
import { useLocation, useNavigate } from 'react-router-dom';
import { addToQueue, getPendingQueue } from '@/lib/offlineQueue';
import useOfflineSync from '@/hooks/useOfflineSync';
import { List, Settings, SquareDashedBottom, ChevronDown, Info, Shapes, MousePointerClick, FlaskConical } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import usePWA from '../hooks/usePWA';
import OfflineIndicator from '../components/OfflineIndicator';
import IOSNavSheet from '../components/map/IOSNavSheet';
import SightingDetailModal from '../components/SightingDetailModal';
import CellCheckInModal from '../components/map/CellCheckInModal';
import UserLandingChoice from '../components/map/UserLandingChoice';
import ManagerLogoutModal from '../components/map/ManagerLogoutModal';

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
  const { isOnline } = usePWA();
  const [navOpen, setNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(() => getPendingQueue().length);

  const handleSynced = useCallback((count) => {
    setPendingCount(getPendingQueue().length);
  }, []);
  useOfflineSync(handleSynced);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setCurrentUser(u);
      if (!u) return;

      // Restore active cell from user profile if they're already checked in
      if (u.active_cell_id) {
        try {
          const cells = await base44.entities.Cell.list('-created_date', 200);
          const cell = cells.find(c => c.id === u.active_cell_id);
          if (cell && cell.work_status !== 'completed') {
            setActiveUserCell(cell);
            return; // Skip landing — they're already checked in
          }
        } catch {}
      }

      // Show landing choice for regular users and admins if it's past 3am GMT
      if (u.role !== 'manager') {
        const nowGMT = new Date();
        const hourGMT = nowGMT.getUTCHours();
        if (hourGMT >= 3) {
          // Check if user dismissed landing within the last hour
          const dismissedAt = localStorage.getItem('landing_dismissed_at');
          if (dismissedAt && Date.now() - parseInt(dismissedAt) < 60 * 60 * 1000) {
            return; // Still within 1hr grace period
          }
          setShowLanding(true);
        }
      }
    }).catch(() => {});
  }, []);
  useEffect(() => { base44.analytics.track({ eventName: 'page_view', properties: { page: 'map' } }); }, []);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [waypoints, setWaypoints] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);

  // On mount, handle ?lat=&lng= query params (from email links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    if (!isNaN(lat) && !isNaN(lng)) {
      const attempt = (tries = 0) => {
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 18, { animate: false });
        } else if (tries < 20) {
          setTimeout(() => attempt(tries + 1), 100);
        }
      };
      attempt();
      return;
    }
    base44.entities.AppSettings.list().then((records) => {
      if (!location.state?.flyTo && records.length > 0 && records[0].default_lat && records[0].default_lng) {
        setMapCenter([records[0].default_lat, records[0].default_lng]);
        if (records[0].default_zoom) mapRef.current?.setZoom(records[0].default_zoom);
      }
    });
    if (!location.state?.flyTo && !location.state?.fitBounds) {
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
  const [locationData, setLocationData] = useState(null);
  const [locating, setLocating] = useState(false);
  const [speciesModalLocation, setSpeciesModalLocation] = useState(null);
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [speciesSightings, setSpeciesSightings] = useState([]);
  const [isAreaMode, setIsAreaMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [areaClosed, setAreaClosed] = useState(false);
  const [savedCells, setSavedCells] = useState([]);

  const loadData = useCallback(async () => {
      try {
        const [cellData, sightingData] = await Promise.all([
          base44.entities.Cell.list('-created_date', 100),
          base44.entities.Sighting.list('-created_date', 500),
        ]);

        setSavedCells(cellData);
        setSpeciesSightings(sightingData);
        await indexedDBCache.cacheCells(cellData);
      } catch (e) {
        const cached = await indexedDBCache.getCells();
        setSavedCells(cached);
      }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    function handleFilterChange() { loadData(); }
    window.addEventListener('cells_filter_changed', handleFilterChange);
    return () => window.removeEventListener('cells_filter_changed', handleFilterChange);
  }, [loadData]);

  useEffect(() => {
    if (location.state?.selectedCell) {
      setSelectedCell(location.state.selectedCell);
    }
    if (location.state?.editCell) {
      const cell = location.state.editCell;
      let pts = [];
      try { pts = JSON.parse(cell.points); } catch {}
      setEditingCell({ cell, points: pts });
      // Fly to the cell bounds
      const attempt = (tries = 0) => {
        if (mapRef.current && pts.length > 0) {
          const bounds = pts.map(p => [p.lat, p.lng]);
          mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true });
        } else if (tries < 20) {
          setTimeout(() => attempt(tries + 1), 100);
        }
      };
      attempt();
    }
  }, [location.state?.selectedCell, location.state?.editCell]);

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
  const CATEGORIES = ['Species', 'Free Parking', 'Hydrant', 'Incident', 'Public Toilet', 'Cafe / Van'];
  const [activeCategories, setActiveCategories] = useState([]);
  const [unadoptedRoads, setUnadoptedRoads] = useState([]);
  const [editingCell, setEditingCell] = useState(null); // { cell, points }
  const [showLanding, setShowLanding] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [preselectedCell, setPreselectedCell] = useState(null);
  const [activeUserCell, setActiveUserCell] = useState(null); // the cell the user is logged into
  const [managerLogoutMessage, setManagerLogoutMessage] = useState(null);

  const mapRef = useRef(null);

  // Poll for manager-forced logout notifications (every 30s)
  useEffect(() => {
    let interval;
    const check = async () => {
      try {
        const u = await base44.auth.me();
        if (u?.manager_logout_message) {
          setManagerLogoutMessage(u.manager_logout_message);
          setActiveUserCell(null);
          setCurrentUser(prev => ({ ...prev, active_cell_id: '', manager_logout_message: '' }));
        }
      } catch {}
    };
    // Only poll for non-admin users
    if (currentUser && currentUser.role !== 'admin') {
      interval = setInterval(check, 30000);
    }
    return () => clearInterval(interval);
  }, [currentUser?.role]);

  function handleCheckIn(cell) {
    setShowCheckIn(false);
    setShowLanding(false);
    setActiveUserCell(cell);
    setCurrentUser(u => ({ ...u, active_cell_id: cell.id, active_cell_checkin_date: new Date().toISOString().split('T')[0], office_id: cell.office_id || u?.office_id }));
    // Reload data so map shows cells/sightings filtered by the newly chosen office
    loadData();
    // Update local savedCells so the map shows orange
    setSavedCells(prev => prev.map(c => c.id === cell.id ? { ...c, work_status: 'in_progress' } : c));
    // Enable all sighting categories
    setActiveCategories(['Species', 'Free Parking', 'Hydrant', 'Incident', 'Public Toilet', 'Cafe / Van']);
    // Fly to the cell
    let pts = [];
    try { pts = JSON.parse(cell.points); } catch {}
    if (pts.length > 0 && mapRef.current) {
      const bounds = pts.map(p => [p.lat, p.lng]);
      setTimeout(() => mapRef.current?.fitBounds(bounds, { padding: [60, 60], animate: true }), 300);
    }
  }

  function handleCellContinue() {
    // Show the resume modal with photo upload
    setShowCheckIn(true);
    setPreselectedCell(null);
  }

  async function handleCellFinish() {
    if (!activeUserCell) return;
    // Use backend function — marks cell completed and logs off ALL users on that cell
    await base44.functions.invoke('completeCellAndLogOffUsers', {
      cellId: activeUserCell.id,
      cellName: activeUserCell.name || 'Unnamed Cell',
      cellArea: activeUserCell.area || '',
      managerId: currentUser?.manager_id || null,
    });
    setSavedCells(prev => prev.map(c => c.id === activeUserCell.id ? { ...c, work_status: 'completed' } : c));
    await base44.auth.updateMe({ active_cell_id: '', active_cell_prev_status: '', active_cell_checkin_date: '' });
    setCurrentUser(u => ({ ...u, active_cell_id: '', active_cell_prev_status: '', active_cell_checkin_date: '' }));
    setActiveUserCell(null);
    setShowLanding(true);
  }

  async function handleCellLogOff() {
    if (!activeUserCell || !currentUser) return;
    const cellName = activeUserCell.name || 'Unnamed Cell';
    const cellArea = activeUserCell.area || '';
    const recordedAt = new Date().toLocaleString();
    // Log off without completing — status stays in_progress
    await base44.auth.updateMe({ active_cell_id: '', active_cell_prev_status: '', active_cell_checkin_date: '' });
    setCurrentUser(u => ({ ...u, active_cell_id: '', active_cell_prev_status: '', active_cell_checkin_date: '' }));
    setActiveUserCell(null);
    setShowLanding(true);
    // Notify managers
    import('@/lib/notifyManagers').then(({ notifyManagers }) => {
      notifyManagers(
        `Cell Log Off: ${cellArea} — ${cellName}`,
        `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);"><tr><td style="background:#f59e0b;padding:28px 32px;"><p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">⏸️ Cell Log Off</p><p style="margin:6px 0 0;color:#fef3c7;font-size:13px;">Logged off on ${recordedAt}</p></td></tr><tr><td style="padding:28px 32px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #f59e0b;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Cell</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${cellArea ? cellArea + ' — ' : ''}${cellName}</p></td></tr><tr><td style="height:12px;"></td></tr><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #f59e0b;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Worker</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${currentUser?.full_name || currentUser?.email || 'Unknown'}</p></td></tr><tr><td style="height:12px;"></td></tr><tr><td style="padding:10px 14px;background:#fff7ed;border-radius:8px;border-left:4px solid #f59e0b;"><p style="margin:0;font-size:13px;color:#92400e;">Cell status remains <strong>In Progress</strong> — work not yet completed.</p></td></tr></table></td></tr><tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;">Sent automatically from the KerbPro field mapping tool.</p></td></tr></table></td></tr></table></body></html>`,
        'cell_logoff',
        { cell_name: cellName, cell_area: cellArea }
      ).catch(() => {});
    });
  }

  const handleSpotted = useCallback(() => {
    if (locationData?.position) {
      setSpeciesModalLocation({ lat: locationData.position[0], lng: locationData.position[1] });
    } else {
      // Try to get current position
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setSpeciesModalLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          alert('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [locationData]);

  const handleMapClick = useCallback((latlng) => {
    if (isAreaMode && !areaClosed) {
      setAreaPoints(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
    } else if (isPlotting) {
      setWaypoints(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
    }
  }, [isAreaMode, areaClosed, isPlotting]);

  const handleUndo = useCallback(() => {
    setWaypoints(prev => prev.slice(0, -1));
  }, []);

  const handleUndoAreaPoint = useCallback(() => {
    setAreaPoints(prev => prev.slice(0, -1));
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
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
      <OfflineIndicator isOnline={isOnline} />
      {pendingCount > 0 && (
        <div className="absolute z-[1100] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}>
          <span>⏳ {pendingCount} sighting{pendingCount > 1 ? 's' : ''} queued — waiting for signal</span>
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        zoomSnap={0.5}
        zoomDelta={1}
        maxZoom={19}
        zoomAnimation={true}
        markerZoomAnimation={true}
        ref={mapRef}
      >
        <TileLayer
          key={tileLayer}
          attribution={currentTile.attribution}
          url={currentTile.url}
          maxZoom={currentTile.maxZoom}
          maxNativeZoom={currentTile.maxNativeZoom || currentTile.maxZoom}
          keepBuffer={4}
        />
        <MapClickHandler onMapClick={handleMapClick} isActive={isPlotting || (isAreaMode && !areaClosed)} />
        <LocationWatcher onLocationUpdate={setLocationData} />
        <RouteLine waypoints={waypoints} />
        <WaypointMarkers waypoints={waypoints} onRemoveWaypoint={handleRemoveWaypoint} />
        <SpeciesMarkers
          sightings={speciesSightings.filter(s => {
            const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
            return activeCategories.includes(cat);
          })}
          onViewDetails={(s) => {
            setSelectedSighting(s);
            const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
            if (!activeCategories.includes(cat)) {
              setActiveCategories(prev => [...prev, cat]);
            }
          }}
          onRemove={(i) => {
            const visible = speciesSightings.filter(s => {
              const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
              return activeCategories.includes(cat);
            });
            const target = visible[i];
            setSpeciesSightings(prev => prev.filter(s => s !== target));
          }}
          onSightingMoved={(id, lat, lng) => {
            setSpeciesSightings(prev => prev.map(s => s.id === id ? { ...s, lat, lng } : s));
          }}
        />
        {locationData?.position && (
          <LocationMarker position={locationData.position} accuracy={locationData.accuracy} />
        )}
        <UnadoptedRoadsLayer roads={unadoptedRoads} />
        <SavedCellsLayer
          cells={savedCells}
          userRole={currentUser?.role}
          activeUserCell={activeUserCell}
          locked={isAreaMode || !!editingCell}
          onCellClick={(cell) => {
            if (activeUserCell) {
              // If already logged into any cell, open nav menu
              setNavOpen(true);
            } else {
              // Not logged in, open check-in modal for clicked cell
              setPreselectedCell(cell);
              setShowCheckIn(true);
            }
          }}
        />
        {editingCell && (
          <CellEditLayer
            points={editingCell.points}
            onChange={(pts) => setEditingCell(prev => ({ ...prev, points: pts }))}
          />
        )}
        {isAreaMode && (
          <AreaDrawer
            points={areaPoints}
            closed={areaClosed}
            onClose={() => setAreaClosed(true)}
          />
        )}
      </MapContainer>

      {/* Top bar — single flex row, guaranteed no overlaps */}
      <div
        className="absolute z-[1000] left-4 right-4 flex items-center gap-2"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        {/* Burger */}
        <button
          onClick={() => setNavOpen(true)}
          className="w-11 h-11 flex-shrink-0 rounded-full bg-white/90 backdrop-blur-xl shadow-md flex items-center justify-center"
        >
          <List className="h-5 w-5 text-gray-700" />
        </button>

        {/* Search — fills remaining space */}
        <div className="flex-1 min-w-0">
          <SearchBox mapRef={mapRef} />
        </div>

        {/* Locate */}
        <LocateButton locationData={locationData} mapRef={mapRef} loading={locating} setLoading={setLocating} />

        {/* Tile layer */}
        <TileLayerSelector currentLayer={tileLayer} onChangeLayer={setTileLayer} />
      </div>

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

      <IOSNavSheet
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onSpotted={() => { handleSpotted(); }}
        isAreaMode={isAreaMode}
        onToggleAreaMode={() => { setIsAreaMode(!isAreaMode); setIsPlotting(false); setAreaPoints([]); setAreaClosed(false); navigate('/'); }}
        isPlotting={isPlotting}
        onTogglePlotting={() => { setIsPlotting(!isPlotting); }}
        activeCategories={activeCategories}
        onChangeCategories={setActiveCategories}
        cells={savedCells}
        selectedCell={selectedCell}
        activeUserCell={activeUserCell}
        onCellContinue={handleCellContinue}
        onCellFinish={handleCellFinish}
        onCellLogOff={handleCellLogOff}
      />
      {showLanding && !showCheckIn && (
        <UserLandingChoice
          onViewMap={() => { localStorage.setItem('landing_dismissed_at', Date.now().toString()); setShowLanding(false); }}
          onStartCell={() => { setPreselectedCell(null); setShowLanding(false); setShowCheckIn(true); }}
        />
      )}
      {showCheckIn && <CellCheckInModal currentUser={currentUser} preselectedCell={preselectedCell} onCheckIn={handleCheckIn} onPhoneSaved={setCurrentUser} mode={activeUserCell && !preselectedCell ? 'resume' : 'checkin'} activeCell={activeUserCell} onDismiss={() => { setShowCheckIn(false); setPreselectedCell(null); }} />}

      {managerLogoutMessage && (
        <ManagerLogoutModal
          message={managerLogoutMessage}
          onStartNewCell={() => { setManagerLogoutMessage(null); setShowLanding(false); setShowCheckIn(true); }}
          onDismiss={() => { setManagerLogoutMessage(null); }}
        />
      )}

      {selectedSighting && (
        <SightingDetailModal sighting={selectedSighting} onClose={() => setSelectedSighting(null)} />
      )}

      {/* Species Modal */}
      {speciesModalLocation && (
        <SpeciesModal
          location={speciesModalLocation}
          onClose={() => { setSpeciesModalLocation(null); }}
          onSaved={async (sighting) => {
            setSpeciesModalLocation(null);
            setSpeciesSightings(prev => [...prev, sighting]);
            // Activate the category filter for this sighting
            if (sighting.category && !activeCategories.includes(sighting.category)) {
              setActiveCategories(prev => [...prev, sighting.category]);
            }
            const sightingData = {
              species: sighting.species,
              notes: sighting.notes,
              lat: sighting.lat,
              lng: sighting.lng,
              photo_url: sighting.photoUrl || null,
              reported_by: currentUser?.full_name || currentUser?.email || null,
              status_details: sighting.status_details || null,
            };
            if (navigator.onLine) {
              await base44.entities.Sighting.create(sightingData);
            } else {
              addToQueue(sightingData);
              setPendingCount(getPendingQueue().length);
            }
          }}
        />
      )}

      {/* Edit cell toolbar */}
      {editingCell && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2" style={{bottom: 'max(11rem, calc(env(safe-area-inset-bottom) + 10rem))'}}>
          <div className="bg-amber-500 rounded-full shadow-lg px-4 py-2.5 text-sm text-white font-medium">
            Drag points to reshape
          </div>
          <button
            onClick={async () => {
              await base44.entities.Cell.update(editingCell.cell.id, { points: JSON.stringify(editingCell.points) });
              setSavedCells(prev => prev.map(c => c.id === editingCell.cell.id ? { ...c, points: JSON.stringify(editingCell.points) } : c));
              setEditingCell(null);
            }}
            className="bg-green-500 text-white font-semibold text-sm rounded-full shadow-lg px-4 py-2.5"
          >
            Save ✓
          </button>
          <button
            onClick={() => setEditingCell(null)}
            className="bg-white text-gray-600 font-semibold text-sm rounded-full shadow-lg px-4 py-2.5 border border-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Hint banners — iOS pill style */}
      {isAreaMode && !areaClosed && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 flex-wrap justify-center px-4" style={{bottom: 'max(11rem, calc(env(safe-area-inset-bottom) + 10rem))'}}>
          <div className="bg-indigo-500 rounded-full shadow-lg px-5 py-2.5 text-sm text-white font-medium">
            {areaPoints.length < 3
              ? `Tap to place points (${areaPoints.length} placed, need at least 3)`
              : `${areaPoints.length} points placed — close shape`}
          </div>
          {areaPoints.length > 0 && (
            <button onClick={handleUndoAreaPoint} className="bg-white text-indigo-600 font-semibold text-sm rounded-full shadow-lg px-4 py-2.5 border border-indigo-100">
              ↩ Undo
            </button>
          )}
          {areaPoints.length >= 3 && (
            <button onClick={() => setAreaClosed(true)} className="bg-white text-indigo-600 font-semibold text-sm rounded-full shadow-lg px-4 py-2.5 border border-indigo-100">
              Close Shape ✓
            </button>
          )}
        </div>
      )}
      {!isAreaMode && isPlotting && waypoints.length === 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1000]" style={{bottom: 'max(11rem, calc(env(safe-area-inset-bottom) + 6rem))'}}>
          <div className="bg-white/90 backdrop-blur-xl rounded-full shadow-lg px-5 py-2.5 text-sm text-gray-500 font-medium">
            Tap the map to start plotting your route
          </div>
        </div>
      )}
    </div>
  );
}