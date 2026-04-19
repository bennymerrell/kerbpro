import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Building2, SquareDashedBottom, LogIn, Leaf } from 'lucide-react';

export default function CellCheckInModal({ onCheckIn }) {
  const [offices, setOffices] = useState([]);
  const [cells, setCells] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [selectedCellId, setSelectedCellId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Office.list(),
      base44.entities.Cell.list('-created_date', 200),
    ]).then(([o, c]) => {
      setOffices(o);
      setCells(c);
      setLoading(false);
    });
  }, []);

  const filteredCells = selectedOfficeId
    ? cells.filter(c => c.office_id === selectedOfficeId)
    : cells;

  async function handleSubmit() {
    if (!selectedCellId) return;
    setSubmitting(true);
    const cell = cells.find(c => c.id === selectedCellId);
    if (!cell) return;

    const prevStatus = cell.work_status || 'not_started';
    const today = new Date().toISOString().split('T')[0];

    // Update cell to in_progress
    await base44.entities.Cell.update(cell.id, { work_status: 'in_progress' });

    // Save active cell on user profile
    await base44.auth.updateMe({
      active_cell_id: cell.id,
      active_cell_prev_status: prevStatus,
      active_cell_checkin_date: today,
    });

    setSubmitting(false);
    onCheckIn({ ...cell, work_status: 'in_progress' });
  }

  return (
    <div className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-5 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-green-300" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Kerb</span>
          </div>
          <h2 className="text-white font-bold text-lg">Good morning! 👋</h2>
          <p className="text-white/80 text-sm mt-1">Please log into your cell to begin work</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Office selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Building2 className="h-3.5 w-3.5" /> Office Area
              </label>
              <select
                value={selectedOfficeId}
                onChange={e => { setSelectedOfficeId(e.target.value); setSelectedCellId(''); }}
                className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Offices</option>
                {offices.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            {/* Cell selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <SquareDashedBottom className="h-3.5 w-3.5" /> Cell Number
              </label>
              <select
                value={selectedCellId}
                onChange={e => setSelectedCellId(e.target.value)}
                className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Select a cell —</option>
                {filteredCells.map(c => (
                  <option key={c.id} value={c.id}>{c.name || 'Unnamed'}{c.area ? ` (${c.area})` : ''}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedCellId || submitting}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Start Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
}