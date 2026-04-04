import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, FlaskConical, Loader2 } from 'lucide-react';

export default function CellSprayHistory({ cellId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), quantity_liters: '', notes: '' });

  useEffect(() => {
    base44.entities.SprayLog.filter({ cell_id: cellId }, '-date', 50)
      .then(data => { setLogs(data); setLoading(false); });
  }, [cellId]);

  async function handleAdd() {
    if (!form.date) return;
    setSaving(true);
    const entry = await base44.entities.SprayLog.create({
      cell_id: cellId,
      date: form.date,
      quantity_liters: form.quantity_liters ? parseFloat(form.quantity_liters) : null,
      notes: form.notes || null,
    });
    setLogs(prev => [entry, ...prev]);
    setForm({ date: new Date().toISOString().slice(0, 10), quantity_liters: '', notes: '' });
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(log) {
    await base44.entities.SprayLog.delete(log.id);
    setLogs(prev => prev.filter(l => l.id !== log.id));
  }

  return (
    <div className="border-t border-border px-4 py-3 bg-muted/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Spray History</span>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Treatment
        </button>
      </div>

      {showForm && (
        <div className="bg-background border border-border rounded-xl p-3 mb-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground font-medium block mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground font-medium block mb-1">Quantity (L)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 12.5"
                value={form.quantity_liters}
                onChange={e => setForm(f => ({ ...f, quantity_liters: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-1">Notes</label>
            <input
              type="text"
              placeholder="Optional notes…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 h-8 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.date}
              className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-3 text-muted-foreground text-xs gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No treatments logged yet.</p>
      ) : (
        <div className="space-y-1.5">
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">{log.date}</div>
                {(log.quantity_liters || log.notes) && (
                  <div className="text-[10px] text-muted-foreground truncate">
                    {log.quantity_liters ? `${log.quantity_liters}L` : ''}
                    {log.quantity_liters && log.notes ? ' · ' : ''}
                    {log.notes || ''}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(log)}
                className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}