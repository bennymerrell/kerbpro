import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FlaskConical, Pencil, Check, X } from 'lucide-react';

const UNITS = ['litres', 'kg'];

function LogForm({ onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ date: today, chemical_name: '', unit: 'litres', start_amount: '', end_amount: '', notes: '' });
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await base44.entities.ChemicalLog.create({
      date: form.date,
      chemical_name: form.chemical_name,
      unit: form.unit,
      start_amount: parseFloat(form.start_amount),
      end_amount: form.end_amount !== '' ? parseFloat(form.end_amount) : null,
      notes: form.notes || null,
    });
    setSaving(false);
    onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3 mb-4">
      <div className="text-sm font-semibold text-foreground mb-1">New Chemical Log</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground font-medium">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
            className="w-full mt-1 h-9 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">Chemical Name</label>
          <input type="text" value={form.chemical_name} onChange={e => set('chemical_name', e.target.value)} placeholder="e.g. Glyphosate" required
            className="w-full mt-1 h-9 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">Unit</label>
          <select value={form.unit} onChange={e => set('unit', e.target.value)}
            className="w-full mt-1 h-9 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">Start Amount</label>
          <input type="number" step="0.01" value={form.start_amount} onChange={e => set('start_amount', e.target.value)} placeholder="0.00" required
            className="w-full mt-1 h-9 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">End Amount <span className="text-muted-foreground/60">(optional)</span></label>
          <input type="number" step="0.01" value={form.end_amount} onChange={e => set('end_amount', e.target.value)} placeholder="Fill in later…"
            className="w-full mt-1 h-9 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">Notes</label>
          <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional…"
            className="w-full mt-1 h-9 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Log'}
        </button>
        <button type="button" onClick={onCancel} className="h-8 px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditableRow({ log, currentUser, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    start_amount: log.start_amount ?? '',
    end_amount: log.end_amount ?? '',
    notes: log.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave() {
    setSaving(true);
    const updated = await base44.entities.ChemicalLog.update(log.id, {
      start_amount: parseFloat(form.start_amount),
      end_amount: form.end_amount !== '' ? parseFloat(form.end_amount) : null,
      notes: form.notes || null,
    });
    setSaving(false);
    setEditing(false);
    onUpdated({ ...log, ...updated });
  }

  const usage = (log.end_amount != null) ? (log.start_amount - log.end_amount).toFixed(2) : null;
  const isOwner = log.created_by === currentUser?.email;

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{log.chemical_name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{log.date}</span>
            {log.end_amount == null && (
              <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">Awaiting end amount</span>
            )}
          </div>

          {editing ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Start</label>
                <input type="number" step="0.01" value={form.start_amount} onChange={e => set('start_amount', e.target.value)}
                  className="w-full mt-0.5 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">End</label>
                <input type="number" step="0.01" value={form.end_amount} onChange={e => set('end_amount', e.target.value)} placeholder="—"
                  className="w-full mt-0.5 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Notes</label>
                <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="—"
                  className="w-full mt-0.5 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span>Start: <strong className="text-foreground">{log.start_amount} {log.unit}</strong></span>
              <span>End: <strong className="text-foreground">{log.end_amount != null ? `${log.end_amount} ${log.unit}` : '—'}</strong></span>
              {usage != null && <span>Used: <strong className="text-destructive">{usage} {log.unit}</strong></span>}
              {log.notes && <span className="text-[10px]">{log.notes}</span>}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDeleted(log.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</div>
      {unit && <div className="text-xs text-muted-foreground mt-0.5">{unit}</div>}
    </div>
  );
}

export default function ChemicalLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('personal');

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)); }, []);
  useEffect(() => { loadLogs(); }, []);

  async function loadLogs() {
    setLoading(true);
    const data = await base44.entities.ChemicalLog.list('-date', 200);
    setLogs(data);
    setLoading(false);
  }

  async function handleDelete(id) {
    await base44.entities.ChemicalLog.delete(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  function handleUpdated(updated) {
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
  }

  const myLogs = currentUser ? logs.filter(l => l.created_by === currentUser.email) : [];
  const displayLogs = view === 'personal' ? myLogs : logs;

  function totalUsage(logList) {
    return logList.filter(l => l.end_amount != null).reduce((acc, l) => acc + (l.start_amount - l.end_amount), 0).toFixed(2);
  }

  function byChemical(logList) {
    const map = {};
    logList.filter(l => l.end_amount != null).forEach(l => {
      if (!map[l.chemical_name]) map[l.chemical_name] = { used: 0, unit: l.unit };
      map[l.chemical_name].used += (l.start_amount - l.end_amount);
    });
    return map;
  }

  const chemMap = byChemical(displayLogs);
  const pending = displayLogs.filter(l => l.end_amount == null).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Chemical Logs</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView('personal')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'personal' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/60'}`}>My Usage</button>
            <button onClick={() => setView('company')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'company' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/60'}`}>Company</button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Log
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {showForm && <LogForm onSave={() => { setShowForm(false); loadLogs(); }} onCancel={() => setShowForm(false)} />}

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {view === 'personal' ? 'My Overview' : 'Company Overview'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Total Entries" value={displayLogs.length} />
            <StatCard label="Total Used" value={totalUsage(displayLogs)} color="text-destructive" />
            {pending > 0 && <StatCard label="Awaiting End Amount" value={pending} color="text-amber-600" />}
          </div>

          {Object.keys(chemMap).length > 0 && (
            <div className="mt-3 bg-card border border-border rounded-xl divide-y divide-border/50">
              {Object.entries(chemMap).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs font-medium text-foreground">{name}</span>
                  <span className="text-xs text-destructive font-bold">{data.used.toFixed(2)} {data.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Log Entries</div>
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-8">Loading…</div>
          ) : displayLogs.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No logs yet. Add your first entry above.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {displayLogs.map(log => (
                <EditableRow key={log.id} log={log} currentUser={currentUser} onUpdated={handleUpdated} onDeleted={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}