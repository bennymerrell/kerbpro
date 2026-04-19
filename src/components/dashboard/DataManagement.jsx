import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trash2, Pencil, MapPin, SquareDashedBottom, FlaskConical, X, Check, Camera, Image } from 'lucide-react';

const SECTIONS = [
  { key: 'sightings', label: 'Sightings', icon: MapPin },
  { key: 'cells', label: 'Cells', icon: SquareDashedBottom },
  { key: 'chemical_logs', label: 'Chemical Logs', icon: FlaskConical },
];

function EditModal({ section, item, offices, onClose, onSave }) {
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploadingPhoto(false);
  }

  function field(label, key, type = 'text') {
    return (
      <div key={key}>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={form[key] || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={3}
            className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        ) : (
          <input
            type={type}
            value={form[key] ?? ''}
            onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) || '' : e.target.value }))}
            className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    const entityMap = { sightings: 'Sighting', cells: 'Cell', chemical_logs: 'ChemicalLog' };
    // Only send editable fields (strip read-only built-ins)
    const { id, created_date, updated_date, created_by, ...editable } = form;
    await base44.entities[entityMap[section]].update(item.id, editable);
    onSave({ ...item, ...editable });
    setSaving(false);
    onClose();
  }

  const photoField = section === 'sightings' ? (
    <div key="photo">
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Photo</label>
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      {form.photo_url ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={form.photo_url} alt="Sighting" className="w-full h-36 object-cover" />
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="h-7 px-2.5 rounded-lg bg-black/60 text-white text-xs font-medium flex items-center gap-1 hover:bg-black/80 transition-colors"
            >
              {uploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              Change
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, photo_url: '' }))}
              className="h-7 w-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="w-full h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          {uploadingPhoto ? <Loader2 className="h-5 w-5 animate-spin" /> : <Image className="h-5 w-5" />}
          <span className="text-xs">{uploadingPhoto ? 'Uploading…' : 'Add Photo'}</span>
        </button>
      )}
    </div>
  ) : null;

  const isHydrant = (form.species || '').includes('[Hydrant]');
  const statusField = isHydrant ? (
    <div key="status_details">
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Status</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, status_details: 'working' }))}
          className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            form.status_details === 'working'
              ? 'bg-emerald-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          ✅ Working
        </button>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, status_details: 'not_working' }))}
          className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            form.status_details === 'not_working'
              ? 'bg-red-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-700'
          }`}
        >
          ❌ Not Working
        </button>
      </div>
    </div>
  ) : null;

  const officeField = section === 'cells' ? (
    <div key="office_id">
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Office</label>
      <select
        value={form.office_id || ''}
        onChange={e => setForm(f => ({ ...f, office_id: e.target.value }))}
        className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">— None —</option>
        {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  ) : null;

  const fields = section === 'sightings'
    ? [photoField, field('Species', 'species'), field('Notes', 'notes', 'textarea'), field('Reported By', 'reported_by'), field('Lat', 'lat', 'number'), field('Lng', 'lng', 'number'), statusField].filter(Boolean)
    : section === 'cells'
    ? [field('Name', 'name'), field('Area', 'area'), officeField]
    : [field('Week Start', 'week_start', 'date'), field('Week End', 'week_end', 'date'), field('Notes', 'notes', 'textarea')];

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Edit Record</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {fields}
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

function Row({ item, onDelete, onEdit, children }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex-1 min-w-0">{children}</div>
      <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function DataManagement() {
  const [activeSection, setActiveSection] = useState('sightings');
  const [data, setData] = useState({ sightings: [], cells: [], chemical_logs: [] });
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Sighting.list('-created_date', 200),
      base44.entities.Cell.list('-created_date', 200),
      base44.entities.ChemicalLog.list('-week_start', 200),
      base44.entities.Office.list(),
    ]).then(([sightings, cells, chemical_logs, offices]) => {
      setData({ sightings, cells, chemical_logs });
      setOffices(offices);
      setLoading(false);
    });
  }, []);

  async function handleDelete(section, id) {
    const entityMap = { sightings: 'Sighting', cells: 'Cell', chemical_logs: 'ChemicalLog' };
    await base44.entities[entityMap[section]].delete(id);
    setData(prev => ({ ...prev, [section]: prev[section].filter(i => i.id !== id) }));
  }

  function handleSave(updated) {
    setData(prev => ({ ...prev, [activeSection]: prev[activeSection].map(i => i.id === updated.id ? updated : i) }));
  }

  const items = data[activeSection] || [];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Data Management</h2>

      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeSection === key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeSection === key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              {data[key]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-10">No records found.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
          {activeSection === 'sightings' && items.map(i => (
            <Row key={i.id} item={i} onDelete={id => handleDelete('sightings', id)} onEdit={setEditing}>
              <div className="text-xs font-medium text-foreground truncate">{i.species || '—'}</div>
              <div className="text-[11px] text-muted-foreground">{i.lat?.toFixed(4)}, {i.lng?.toFixed(4)} · {i.reported_by || 'Unknown'}</div>
            </Row>
          ))}
          {activeSection === 'cells' && items.map(i => {
            const officeName = offices.find(o => o.id === i.office_id)?.name;
            return (
              <Row key={i.id} item={i} onDelete={id => handleDelete('cells', id)} onEdit={setEditing}>
                <div className="text-xs font-medium text-foreground truncate">{i.name || 'Unnamed'}</div>
                <div className="text-[11px] text-muted-foreground">{i.area || '—'} · {officeName || 'No Office'}</div>
              </Row>
            );
          })}
          {activeSection === 'chemical_logs' && items.map(i => (
            <Row key={i.id} item={i} onDelete={id => handleDelete('chemical_logs', id)} onEdit={setEditing}>
              <div className="text-xs font-medium text-foreground">w/c {i.week_start}</div>
              <div className="text-[11px] text-muted-foreground">{i.created_by || '—'}</div>
            </Row>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          section={activeSection}
          item={editing}
          offices={offices}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}