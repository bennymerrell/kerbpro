import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trash2, Pencil, X, Check, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pointInPolygon } from '@/lib/mapUtils';
import { SightingThumbnail } from './ThumbailPreview';

const CATEGORIES = ['Species', 'Free Parking', 'Hydrant', 'WO Point', 'Public Toilet', 'Cafe / Van'];

const CATEGORY_BG = {
  'Species':      'bg-green-100 text-green-700',
  'Free Parking': 'bg-blue-100 text-blue-700',
  'Hydrant':      'bg-amber-100 text-amber-700',
  'WO Point':     'bg-sky-100 text-sky-600',
  'Public Toilet':'bg-orange-100 text-orange-700',
  'Cafe / Van':   'bg-red-100 text-red-700',
};

function EditModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...editable } = form;
    await base44.entities.Sighting.update(item.id, editable);
    onSave({ ...item, ...editable });
    setSaving(false);
    onClose();
  }

  const isHydrant = (form.species || '').includes('[Hydrant]') || (form.species || '').includes('[WO Point]');

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Edit Sighting</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {[['Species', 'species'], ['Notes', 'notes'], ['Reported By', 'reported_by']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>
              <input
                type="text"
                value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
          {isHydrant && (
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Status</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, status_details: 'working' }))}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${form.status_details === 'working' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  ✅ Working
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, status_details: 'not_working' }))}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${form.status_details === 'not_working' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  ❌ Not Working
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SightingsDashboard() {
  const [sightings, setSightings] = useState([]);
  const [cells, setCells] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [cellFilter, setCellFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Sighting.list('-created_date', 500),
      base44.entities.Cell.list('-created_date', 200),
      base44.entities.Office.list(),
    ]).then(([sightingData, cellData, officeData]) => {
      setSightings(sightingData);
      setCells(cellData);
      setOffices(officeData);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id) {
    await base44.entities.Sighting.delete(id);
    setSightings(prev => prev.filter(s => s.id !== id));
  }

  function handleSave(updated) {
    setSightings(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  const officeMap = Object.fromEntries(offices.map(o => [o.id, o.name]));
  const areas = [...new Set(cells.filter(c => !officeFilter || c.office_id === officeFilter).map(c => c.area).filter(Boolean))].sort();
  const filteredCellOptions = cells.filter(c => (!officeFilter || c.office_id === officeFilter) && (!areaFilter || c.area === areaFilter));

  const polygonsForFilter = useMemo(() => {
    if (cellFilter) return cells.filter(c => c.id === cellFilter).map(c => { try { return JSON.parse(c.points || '[]'); } catch { return []; } }).filter(pts => pts.length >= 3);
    if (areaFilter) return cells.filter(c => c.area === areaFilter && (!officeFilter || c.office_id === officeFilter)).map(c => { try { return JSON.parse(c.points || '[]'); } catch { return []; } }).filter(pts => pts.length >= 3);
    if (officeFilter) return cells.filter(c => c.office_id === officeFilter).map(c => { try { return JSON.parse(c.points || '[]'); } catch { return []; } }).filter(pts => pts.length >= 3);
    return null;
  }, [cells, cellFilter, areaFilter, officeFilter]);

  const filtered = sightings.filter(s => {
    const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
    if (search && !s.species?.toLowerCase().includes(search.toLowerCase()) && !s.notes?.toLowerCase().includes(search.toLowerCase()) && !s.reported_by?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && cat !== categoryFilter) return false;
    if (polygonsForFilter && !(s.lat && s.lng && polygonsForFilter.some(poly => pointInPolygon(s.lat, s.lng, poly)))) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Sightings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} of {sightings.length} records</p>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full text-xs border border-input rounded-lg pl-8 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {offices.length > 0 && (
            <select value={officeFilter} onChange={e => { setOfficeFilter(e.target.value); setAreaFilter(''); setCellFilter(''); }} className="text-xs border border-input rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0">
              <option value="">All Offices</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          {areas.length > 0 && (
            <select value={areaFilter} onChange={e => { setAreaFilter(e.target.value); setCellFilter(''); }} className="text-xs border border-input rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0">
              <option value="">All Contracts</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          <select value={cellFilter} onChange={e => setCellFilter(e.target.value)} className="text-xs border border-input rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0">
            <option value="">All Cells</option>
            {filteredCellOptions.map(c => <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="text-xs border border-input rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-10">No sightings found.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
          {filtered.map(s => {
            const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
            const label = s.species?.replace(/^\[.+?\]\s*/, '').trim() || cat;
            const badgeColor = CATEGORY_BG[cat] || 'bg-muted text-muted-foreground';
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <SightingThumbnail sighting={s} clickable={true} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeColor}`}>{cat}</span>
                    <span className="text-xs font-medium text-foreground truncate">{label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60 flex-shrink-0">#{s.id?.slice(0, 8)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {s.reported_by || 'Unknown'} · {s.created_date ? format(new Date(s.created_date), 'dd MMM yyyy') : '—'}
                    {s.notes && ` · ${s.notes.slice(0, 40)}${s.notes.length > 40 ? '…' : ''}`}
                  </div>
                </div>
                <button onClick={() => setEditing(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </div>
  );
}