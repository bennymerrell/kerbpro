import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_LABELS = {
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  not_started: { label: 'Not Started', color: 'bg-blue-100 text-blue-700' },
};

function EditCellModal({ cell, offices, onClose, onSave }) {
  const [form, setForm] = useState({ name: cell.name || '', area: cell.area || '', office_id: cell.office_id || '' });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await base44.entities.Cell.update(cell.id, form);
    onSave({ ...cell, ...form });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Edit Cell</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Area</label>
            <input
              type="text"
              value={form.area}
              onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Office</label>
            <select
              value={form.office_id}
              onChange={e => setForm(f => ({ ...f, office_id: e.target.value }))}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— None —</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
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

export default function CellsDashboard() {
  const [cells, setCells] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [filterArea, setFilterArea] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Cell.list('-completed_at', 200),
      base44.entities.Office.list(),
    ]).then(([cellData, officeData]) => {
      setCells(cellData);
      setOffices(officeData);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id) {
    await base44.entities.Cell.delete(id);
    setCells(prev => prev.filter(c => c.id !== id));
  }

  function handleSave(updated) {
    setCells(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  const areas = [...new Set(cells.map(c => c.area).filter(Boolean))].sort();
  const filteredCells = filterArea ? cells.filter(c => c.area === filterArea) : cells;

  const completedCells = filteredCells.filter(c => c.work_status === 'completed' && c.completed_at);
  const inProgress = filteredCells.filter(c => c.work_status === 'in_progress');
  const notStarted = filteredCells.filter(c => !c.work_status || c.work_status === 'not_started');

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cell Status Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filteredCells.length} of {cells.length} cells</p>
        </div>
        {areas.length > 0 && (
          <select
            value={filterArea}
            onChange={e => setFilterArea(e.target.value)}
            className="text-xs border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{completedCells.length}</div>
          <div className="text-[11px] text-green-600 font-medium mt-0.5">Completed</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-orange-700">{inProgress.length}</div>
          <div className="text-[11px] text-orange-600 font-medium mt-0.5">In Progress</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{notStarted.length}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Not Started</div>
        </div>
      </div>

      {/* All cells — single unified list */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Cells</div>
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
          {filteredCells.map(cell => {
            const s = STATUS_LABELS[cell.work_status] || STATUS_LABELS.not_started;
            const isCompleted = cell.work_status === 'completed' && cell.completed_at;
            return (
              <div key={cell.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCompleted ? 'bg-green-500' : cell.work_status === 'in_progress' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{cell.name || 'Unnamed Cell'}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {isCompleted
                      ? `${format(new Date(cell.completed_at), 'dd MMM yyyy')}${cell.completed_by ? ` · ${cell.completed_by}` : ''}`
                      : [cell.area].filter(Boolean).join(' · ') || '—'
                    }
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                <button onClick={() => setEditing(cell)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(cell.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {filteredCells.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-10">No cells found.</div>
          )}
        </div>
      </div>

      {editing && (
        <EditCellModal
          cell={editing}
          offices={offices}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}