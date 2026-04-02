import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Save, Search, Loader2, CheckCircle, Trash2, AlertTriangle, Plus, X, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingManager, setAddingManager] = useState(false);
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
    base44.entities.Manager.list().then(setManagers);
    base44.entities.User.list().then(setAllUsers);
  }, []);

  async function handleAddManager(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) return;
    setAddingManager(true);
    const m = await base44.entities.Manager.create({ email: user.email, name: user.full_name || null });
    setManagers(prev => [...prev, m]);
    setSelectedUserId('');
    setAddingManager(false);
  }

  async function handleRemoveManager(id) {
    await base44.entities.Manager.delete(id);
    setManagers(prev => prev.filter(m => m.id !== id));
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
          <p className="text-xs text-muted-foreground">These email addresses will receive notifications for all sightings, saved cells, and chemical logs.</p>

          {managers.length > 0 && (
            <div className="space-y-2">
              {managers.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-xs font-medium text-foreground">{m.email}</div>
                    {m.name && <div className="text-[10px] text-muted-foreground">{m.name}</div>}
                  </div>
                  <button onClick={() => handleRemoveManager(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddManager} className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              required
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a user…</option>
              {allUsers
                .filter(u => !managers.some(m => m.email === u.email))
                .map(u => (
                  <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} (${u.email})` : u.email}</option>
                ))
              }
            </select>
            <button type="submit" disabled={addingManager || !selectedUserId} className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60 transition-colors">
              {addingManager ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
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