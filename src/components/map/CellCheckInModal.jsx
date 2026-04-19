import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Building2, SquareDashedBottom, LogIn, Leaf, MapPin, Phone } from 'lucide-react';

export default function CellCheckInModal({ currentUser, onCheckIn, onPhoneSaved }) {
  const [office, setOffice] = useState(null);
  const [cells, setCells] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCellId, setSelectedCellId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneConfirmed, setPhoneConfirmed] = useState(!!currentUser?.phone);

  useEffect(() => {
    const officeId = currentUser?.office_id;

    Promise.all([
      officeId ? base44.entities.Office.list() : Promise.resolve([]),
      base44.entities.Cell.list('-created_date', 200),
    ]).then(([offices, allCells]) => {
      const userOffice = offices.find(o => o.id === officeId) || null;
      setOffice(userOffice);

      const relevantCells = officeId
        ? allCells.filter(c => c.office_id === officeId)
        : allCells;
      setCells(relevantCells);
      setLoading(false);
    });
  }, [currentUser]);

  const areas = [...new Set(cells.map(c => c.area).filter(Boolean))].sort();
  const filteredCells = selectedArea ? cells.filter(c => c.area === selectedArea) : cells;

  // Start work on a new cell
  async function handleStartNew() {
    if (!selectedCellId) return;
    setSubmitting(true);
    const cell = cells.find(c => c.id === selectedCellId);
    if (!cell) return;

    const prevStatus = cell.work_status || 'not_started';
    const today = new Date().toISOString().split('T')[0];

    await base44.entities.Cell.update(cell.id, { work_status: 'in_progress' });
    await base44.auth.updateMe({
      active_cell_id: cell.id,
      active_cell_prev_status: prevStatus,
      active_cell_checkin_date: today,
    });

    // Notify assigned manager
    const me = await base44.auth.me();
    if (me?.manager_id) {
      base44.functions.invoke('notifyCellAction', {
        action: 'started',
        cellName: cell.name || 'Unnamed Cell',
        cellArea: cell.area || '',
        managerId: me.manager_id,
      }).catch(() => {});
    }

    setSubmitting(false);
    onCheckIn({ ...cell, work_status: 'in_progress' });
  }

  async function handleSavePhone() {
    const cleaned = phoneInput.trim();
    if (!cleaned) return;
    setSavingPhone(true);
    await base44.auth.updateMe({ phone: cleaned });
    setSavingPhone(false);
    setPhoneConfirmed(true);
    onPhoneSaved?.({ ...currentUser, phone: cleaned });
  }

  // Show phone capture screen if no phone on record
  if (!phoneConfirmed) {
    return (
      <div className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
          <div className="bg-primary px-5 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-green-300" />
              </div>
              <span className="text-white font-black text-2xl tracking-tight">Kerb</span>
            </div>
            <h2 className="text-white font-bold text-lg">One quick thing 📱</h2>
            <p className="text-white/80 text-sm mt-1">We need your mobile number to notify your manager</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
              <Phone className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
              Your manager will be notified by SMS/WhatsApp when you check in and check out of cells.
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Phone className="h-3.5 w-3.5" /> Mobile Number
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="+44 7700 900000"
                className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleSavePhone}
              disabled={!phoneInput.trim() || savingPhone}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    );
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
            {/* Office — read-only */}
            {office && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Your Office</div>
                  <div className="text-sm font-semibold text-foreground">{office.name}</div>
                </div>
              </div>
            )}

            {areas.length > 0 && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5" /> Cell Area
                </label>
                <select
                  value={selectedArea}
                  onChange={e => { setSelectedArea(e.target.value); setSelectedCellId(''); }}
                  className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Select an area —</option>
                  {areas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <SquareDashedBottom className="h-3.5 w-3.5" /> Cell Number
              </label>
              <select
                value={selectedCellId}
                onChange={e => setSelectedCellId(e.target.value)}
                disabled={!selectedArea}
                className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{selectedArea ? '— Select a cell —' : '— Select an area first —'}</option>
                {filteredCells.map(c => (
                  <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartNew}
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