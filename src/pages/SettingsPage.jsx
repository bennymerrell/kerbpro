import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Save, Search, Loader2, CheckCircle, Trash2, AlertTriangle, X, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [usersError, setUsersError] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [zoom, setZoom] = useState('13');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    base44.entities.User.list().then(setAllUsers).catch(() => setUsersError(true));
  }, []);

  async function handleAddManager(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setUpdatingRole(true);
    await base44.entities.User.update(selectedUserId, { role: 'manager' });
    setAllUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, role: 'manager' } : u));
    setSelectedUserId('');
    setUpdatingRole(false);
  }

  async function handleRemoveManager(userId) {
    await base44.entities.User.update(userId, { role: 'user' });
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'user' } : u));
  }

  useEffect(() => {
    base44.entities.AppSettings.list().then((records) => {
      if (records.length > 0) {
        const s = records[0];
        setSettingsId(s.id);
        setLat(s.default_lat?.toString() || '');
        setLng(s.default_lng?.toString() || '');
        setZoom(s.default_zoom?.toString() || '13');
      }
    });
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
    const data = await res.json();
    if (data.length > 0) {
      setLat(parseFloat(data[0].lat).toFixed(5));
      setLng(parseFloat(data[0].lon).toFixed(5));
    }
    setSearching(false);
  }

  function handleUseMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  async function handleSave() {
    setSaving(true);
    const data = {
      default_lat: parseFloat(lat),
      default_lng: parseFloat(lng),
      default_zoom: parseInt(zoom),
    };
    if (settingsId) {
      await base44.entities.AppSettings.update(settingsId, data);
    } else {
      const created = await base44.entities.AppSettings.create(data);
      setSettingsId(created.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Map Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Set the default map location</p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">← Back to Map</Link>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">

          {/* Search */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search for a location</label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Swindon, UK"
                className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" disabled={searching} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 disabled:opacity-60">
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </button>
            </form>
          </div>

          {/* Use my location */}
          <button
            onClick={handleUseMyLocation}
            disabled={locating}
            className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-60"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            Use my current location
          </button>

          <div className="border-t border-border" />

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="51.55"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-1.78"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default Zoom (1–19)</label>
            <input
              type="number"
              min="1"
              max="19"
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !lat || !lng}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>

        {/* Managers */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Designated Managers</span>
          </div>
          <p className="text-xs text-muted-foreground">Users with the <strong>manager</strong> or <strong>admin</strong> role receive email notifications for all sightings, saved cells, and chemical logs.</p>

          {/* Current managers & admins */}
          {allUsers.filter(u => u.role === 'manager' || u.role === 'admin').length > 0 && (
            <div className="space-y-2">
              {allUsers.filter(u => u.role === 'manager' || u.role === 'admin').map(u => (
                <div key={u.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-xs font-medium text-foreground">{u.full_name || u.email}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[10px] text-primary font-medium capitalize">{u.role}</span>
                      {u.full_name && <span className="text-[10px] text-muted-foreground ml-1">{u.email}</span>}
                    </div>
                  </div>
                  {u.role === 'manager' && (
                    <button onClick={() => handleRemoveManager(u.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {usersError && (
            <p className="text-xs text-destructive">Could not load users — you may need admin access to manage managers.</p>
          )}

          {/* Add manager form */}
          <form onSubmit={handleAddManager} className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              required
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">{allUsers.length === 0 ? 'No users available' : 'Promote user to manager…'}</option>
              {allUsers
                .filter(u => u.role === 'user')
                .map(u => (
                  <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} (${u.email})` : u.email}</option>
                ))
              }
            </select>
            <button type="submit" disabled={updatingRole || !selectedUserId} className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60 transition-colors">
              {updatingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              Assign
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-2xl border border-red-200 shadow-sm p-6 space-y-3 mt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">Danger Zone</span>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Are you sure? This will sign you out. To permanently delete your account, contact support.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => base44.auth.logout()}
                  className="h-8 px-4 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                >
                  Yes, sign out
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-8 px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}