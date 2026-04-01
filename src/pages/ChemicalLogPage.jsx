import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FlaskConical, Pencil, Check, X, User, Building2 } from 'lucide-react';

const UNITS = ['litres', 'kg'];
const EMPTY_CHEM = { chemical_name: '', unit: 'litres', start_amount: '', end_amount: '' };

function parseChemicals(str) {
  try { return JSON.parse(str) || []; } catch { return []; }
}

function getMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatDateRange(start, end) {
  if (!start) return '—';
  const s = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (!end) return `w/c ${s}`;
  const e = new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

// ── Add new weekly log form ─────────────────────────────────────────────────
function LogForm({ onSave, onCancel }) {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [weekEnd, setWeekEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [chemicals, setChemicals] = useState([{ ...EMPTY_CHEM }]);
  const [saving, setSaving] = useState(false);

  function setChemField(i, key, val) {
    setChemicals(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c));
  }
  function addChem() { setChemicals(prev => [...prev, { ...EMPTY_CHEM }]); }
  function removeChem(i) { setChemicals(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const cleaned = chemicals.map(c => ({
      chemical_name: c.chemical_name,
      unit: c.unit,
      start_amount: parseFloat(c.start_amount),
      end_amount: c.end_amount !== '' ? parseFloat(c.end_amount) : null,
    }));
    await base44.entities.ChemicalLog.create({
      week_start: weekStart,
      week_end: weekEnd || null,
      chemicals: JSON.stringify(cleaned),
      notes: notes || null,
    });
    setSaving(false);
    onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-4 mb-4" style={{overflow: 'hidden'}}>
      <div className="text-sm font-semibold text-foreground">New Weekly Log</div>

      <div className="flex flex-col gap-3">
        <div style={{overflow: 'hidden'}}>
          <label className="text-xs text-muted-foreground font-medium">Week Start <span className="text-destructive">*</span></label>
          <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} required
            style={{display: 'block', width: '100%', boxSizing: 'border-box', WebkitAppearance: 'none', appearance: 'none', height: '36px', padding: '0 8px', borderRadius: '8px', border: '1px solid hsl(var(--input))', background: 'hsl(var(--background))', fontSize: '12px', color: 'hsl(var(--foreground))'}} />
        </div>
        <div style={{overflow: 'hidden'}}>
          <label className="text-xs text-muted-foreground font-medium">Week End</label>
          <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)}
            style={{display: 'block', width: '100%', boxSizing: 'border-box', WebkitAppearance: 'none', appearance: 'none', height: '36px', padding: '0 8px', borderRadius: '8px', border: '1px solid hsl(var(--input))', background: 'hsl(var(--background))', fontSize: '12px', color: 'hsl(var(--foreground))'}} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">Notes</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional…"
            className="w-full mt-1 h-9 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Chemical rows */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Chemicals</div>
        {chemicals.map((c, i) => (
          <div key={i} className="border border-border/60 rounded-lg p-2 space-y-2 bg-muted/20">
            <div className="flex gap-2">
              <input type="text" value={c.chemical_name} onChange={e => setChemField(i, 'chemical_name', e.target.value)} placeholder="Chemical name" required
                className="flex-1 h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
              <select value={c.unit} onChange={e => setChemField(i, 'unit', e.target.value)}
                className="w-20 h-8 px-1 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">Start</label>
                <input type="number" step="0.01" value={c.start_amount} onChange={e => setChemField(i, 'start_amount', e.target.value)} placeholder="Start amount" required
                  className="w-full mt-0.5 h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">End (fill in later)</label>
                <input type="number" step="0.01" value={c.end_amount} onChange={e => setChemField(i, 'end_amount', e.target.value)} placeholder="End amount"
                  className="w-full mt-0.5 h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              {chemicals.length > 1 && (
                <button type="button" onClick={() => removeChem(i)} className="mt-4 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"><X className="h-3.5 w-3.5" /></button>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={addChem} className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-1">
          <Plus className="h-3.5 w-3.5" /> Add chemical
        </button>
      </div>

      <div className="flex gap-2">
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

// ── Inline edit row ─────────────────────────────────────────────────────────
function EditableLog({ log, currentUser, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [chemicals, setChemicals] = useState(parseChemicals(log.chemicals));
  const [weekEnd, setWeekEnd] = useState(log.week_end ?? '');
  const [notes, setNotes] = useState(log.notes ?? '');
  const [saving, setSaving] = useState(false);

  function setChemField(i, key, val) {
    setChemicals(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c));
  }
  function addChem() { setChemicals(prev => [...prev, { ...EMPTY_CHEM }]); }
  function removeChem(i) { setChemicals(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleSave() {
    setSaving(true);
    const cleaned = chemicals.map(c => ({
      chemical_name: c.chemical_name,
      unit: c.unit,
      start_amount: parseFloat(c.start_amount),
      end_amount: c.end_amount !== '' && c.end_amount != null ? parseFloat(c.end_amount) : null,
    }));
    const updated = await base44.entities.ChemicalLog.update(log.id, {
      week_end: weekEnd || null,
      chemicals: JSON.stringify(cleaned),
      notes: notes || null,
    });
    setSaving(false);
    setEditing(false);
    onUpdated({ ...log, ...updated, week_end: weekEnd || null, chemicals: JSON.stringify(cleaned), notes });
  }

  function handleCancel() {
    setChemicals(parseChemicals(log.chemicals));
    setWeekEnd(log.week_end ?? '');
    setNotes(log.notes ?? '');
    setEditing(false);
  }

  const chems = parseChemicals(log.chemicals);
  const pendingEndAmounts = chems.some(c => c.end_amount == null);
  const pendingEndDate = !log.week_end;
  const isOwner = log.created_by === currentUser?.email;

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-semibold text-foreground">{formatDateRange(log.week_start, log.week_end)}</span>
            {(pendingEndAmounts || pendingEndDate) && (
              <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                {pendingEndDate ? 'Week not yet closed' : 'Awaiting end amounts'}
              </span>
            )}
            {log.notes && !editing && <span className="text-[10px] text-muted-foreground">{log.notes}</span>}
          </div>

          {editing ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Week End Date</label>
                  <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)}
                    className="w-full mt-0.5 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Notes</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="—"
                    className="w-full mt-0.5 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
              </div>
              {chemicals.map((c, i) => (
                <div key={i} className="border border-border/60 rounded-lg p-2 space-y-2 bg-muted/20">
                  <div className="flex gap-2">
                    <input type="text" value={c.chemical_name} onChange={e => setChemField(i, 'chemical_name', e.target.value)} placeholder="Name"
                      className="flex-1 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    <select value={c.unit} onChange={e => setChemField(i, 'unit', e.target.value)}
                      className="w-20 h-7 px-1 rounded border border-input bg-background text-xs focus:outline-none">
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground">Start</label>
                      <input type="number" step="0.01" value={c.start_amount ?? ''} onChange={e => setChemField(i, 'start_amount', e.target.value)} placeholder="Start"
                        className="w-full mt-0.5 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground">End</label>
                      <input type="number" step="0.01" value={c.end_amount ?? ''} onChange={e => setChemField(i, 'end_amount', e.target.value)} placeholder="End"
                        className="w-full mt-0.5 h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    {chemicals.length > 1 && (
                      <button type="button" onClick={() => removeChem(i)} className="mt-4 h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0"><X className="h-3 w-3" /></button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addChem} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                <Plus className="h-3 w-3" /> Add chemical
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {chems.map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground">{c.chemical_name}</span>
                  <span>Start: <strong className="text-foreground">{c.start_amount} {c.unit}</strong></span>
                  <span>End: <strong className="text-foreground">{c.end_amount != null ? `${c.end_amount} ${c.unit}` : '—'}</strong></span>
                  {c.end_amount != null && <span>Used: <strong className="text-destructive">{(c.start_amount - c.end_amount).toFixed(2)} {c.unit}</strong></span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDeleted(log.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stats ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function buildChemicalTotals(logs) {
  const map = {};
  logs.forEach(log => {
    parseChemicals(log.chemicals).forEach(c => {
      if (c.end_amount == null) return;
      const key = `${c.chemical_name} (${c.unit})`;
      if (!map[key]) map[key] = 0;
      map[key] += (c.start_amount - c.end_amount);
    });
  });
  return map;
}

// ── Page ────────────────────────────────────────────────────────────────────
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
    const data = await base44.entities.ChemicalLog.list('-week_start', 200);
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

  const totals = buildChemicalTotals(displayLogs);
  const openWeeks = displayLogs.filter(l => !l.week_end || parseChemicals(l.chemicals).some(c => c.end_amount == null)).length;

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
            <button onClick={() => setView('personal')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'personal' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/60'}`}>
              <User className="h-3.5 w-3.5" /><span className="hidden sm:inline">My Usage</span>
            </button>
            <button onClick={() => setView('company')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'company' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/60'}`}>
              <Building2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Company</span>
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Add Log</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {showForm && <LogForm onSave={() => { setShowForm(false); loadLogs(); }} onCancel={() => setShowForm(false)} />}

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {view === 'personal' ? 'My Overview' : 'Company Overview'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <StatCard label="Total Weeks Logged" value={displayLogs.length} />
            {openWeeks > 0 && <StatCard label="Open / Incomplete" value={openWeeks} color="text-amber-600" />}
          </div>
          {Object.keys(totals).length > 0 && (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {Object.entries(totals).map(([key, used]) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs font-medium text-foreground">{key}</span>
                  <span className="text-xs text-destructive font-bold">{used.toFixed(2)} used</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Weekly Entries</div>
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-8">Loading…</div>
          ) : displayLogs.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No logs yet. Add your first weekly entry above.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {displayLogs.map(log => (
                <EditableLog key={log.id} log={log} currentUser={currentUser} onUpdated={handleUpdated} onDeleted={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}