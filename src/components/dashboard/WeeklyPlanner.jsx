import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2, Plus, X, User, SquareDashedBottom, Check } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';

function getMonday(date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function weekKey(date) {
  return format(date, 'yyyy-MM-dd');
}

// Returns the centroid [lat, lng] of a cell's polygon points
function cellCentroid(cell) {
  try {
    const pts = JSON.parse(cell.points || '[]');
    if (!pts.length) return null;
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    return [lat, lng];
  } catch { return null; }
}

function distKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function AddAssignmentModal({ cells, users, assignments, onAddMultiple, onClose }) {
  const [userId, setUserId] = useState('');
  const [selectedCellIds, setSelectedCellIds] = useState([]);

  // Already assigned cell IDs for this user this week
  const alreadyAssignedCellIds = useMemo(
    () => new Set(assignments.filter(a => a.user_id === userId).map(a => a.cell_id)),
    [assignments, userId]
  );

  // Only show not_started and in_progress cells that aren't already assigned to this user
  const eligibleCells = useMemo(
    () => cells.filter(c =>
      (!c.work_status || c.work_status === 'not_started' || c.work_status === 'in_progress') &&
      !alreadyAssignedCellIds.has(c.id)
    ),
    [cells, alreadyAssignedCellIds]
  );

  // Reference point = centroid of already-assigned cells for this user
  const refPoint = useMemo(() => {
    if (!userId) return null;
    const userAssigned = assignments.filter(a => a.user_id === userId);
    if (!userAssigned.length) return null;
    const anchors = userAssigned
      .map(a => eligibleCells.find(c => c.id === a.cell_id))
      .filter(Boolean)
      .map(cellCentroid)
      .filter(Boolean);
    if (!anchors.length) return null;
    return [
      anchors.reduce((s, p) => s + p[0], 0) / anchors.length,
      anchors.reduce((s, p) => s + p[1], 0) / anchors.length,
    ];
  }, [userId, assignments, eligibleCells]);

  // Sort by proximity when ref point exists
  const sortedCells = useMemo(() => {
    if (!refPoint) return eligibleCells;
    return [...eligibleCells].sort((a, b) => {
      const ca = cellCentroid(a);
      const cb = cellCentroid(b);
      if (!ca && !cb) return 0;
      if (!ca) return 1;
      if (!cb) return -1;
      return distKm(refPoint, ca) - distKm(refPoint, cb);
    });
  }, [eligibleCells, refPoint]);

  function toggleCell(cellId) {
    setSelectedCellIds(prev =>
      prev.includes(cellId) ? prev.filter(id => id !== cellId) : [...prev, cellId]
    );
  }

  function handleAdd() {
    const user = users.find(u => u.id === userId);
    if (!user || !selectedCellIds.length) return;
    const newAssignments = selectedCellIds.map(cid => {
      const cell = eligibleCells.find(c => c.id === cid);
      return {
        user_id: user.id,
        user_name: user.full_name || user.email,
        cell_id: cell.id,
        cell_name: cell.name || 'Unnamed',
        cell_area: cell.area || '',
      };
    });
    onAddMultiple(newAssignments);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-sm text-foreground">Add Assignment</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Worker */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Worker</label>
            <select
              value={userId}
              onChange={e => { setUserId(e.target.value); setSelectedCellIds([]); }}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select a worker —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
          </div>

          {/* Cell multi-select */}
          {userId && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Cells
                  {refPoint && <span className="ml-1 font-normal text-primary">(sorted by proximity)</span>}
                </label>
                {selectedCellIds.length > 0 && (
                  <span className="text-[11px] font-semibold text-primary">{selectedCellIds.length} selected</span>
                )}
              </div>
              <div className="border border-input rounded-lg overflow-hidden divide-y divide-border/50 max-h-64 overflow-y-auto">
                {sortedCells.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No eligible cells.</p>
                )}
                {sortedCells.map(c => {
                  const isSelected = selectedCellIds.includes(c.id);
                  const dist = refPoint && cellCentroid(c) ? distKm(refPoint, cellCentroid(c)) : null;
                  const distLabel = dist != null
                    ? dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`
                    : null;
                  const statusColor = c.work_status === 'in_progress' ? 'bg-orange-400' : 'bg-blue-400';
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCell(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
                    >
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} />
                      <span className="flex-1 text-xs text-foreground truncate">
                        {c.area ? `${c.area} — ` : ''}{c.name || 'Unnamed'}
                      </span>
                      {distLabel && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{distLabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={!userId || selectedCellIds.length === 0}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add {selectedCellIds.length > 0 ? `(${selectedCellIds.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyPlanner() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [plan, setPlan] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [cells, setCells] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Load cells + users once
  useEffect(() => {
    Promise.all([
      base44.entities.Cell.list('-created_date', 200),
      base44.functions.invoke('getUsers', {}),
    ]).then(([cellData, usersRes]) => {
      setCells(cellData.filter(c => c.work_status !== 'completed'));
      setUsers((usersRes?.data?.users || []).filter(u => u.role === 'user'));
    });
  }, []);

  // Load plan for selected week
  useEffect(() => {
    setLoading(true);
    const key = weekKey(weekStart);
    base44.entities.WeeklyPlan.filter({ week_start: key }).then(plans => {
      const existing = plans[0] || null;
      setPlan(existing);
      if (existing) {
        try { setAssignments(JSON.parse(existing.assignments || '[]')); } catch { setAssignments([]); }
      } else {
        setAssignments([]);
      }
      setLoading(false);
    });
  }, [weekStart]); // eslint-disable-line

  async function saveAssignments(newAssignments) {
    setSaving(true);
    const data = { week_start: weekKey(weekStart), assignments: JSON.stringify(newAssignments) };
    if (plan) {
      const updated = await base44.entities.WeeklyPlan.update(plan.id, data);
      setPlan(updated);
    } else {
      const created = await base44.entities.WeeklyPlan.create(data);
      setPlan(created);
    }
    setSaving(false);
  }

  function handleAddAssignment(newAssignments) {
    const next = [...assignments, ...newAssignments];
    setAssignments(next);
    saveAssignments(next);
  }

  function handleRemove(idx) {
    const next = assignments.filter((_, i) => i !== idx);
    setAssignments(next);
    saveAssignments(next);
  }

  const isCurrentWeek = weekKey(weekStart) === weekKey(getMonday(new Date()));

  // Group assignments by user
  const byUser = assignments.reduce((acc, a, idx) => {
    const key = a.user_id;
    if (!acc[key]) acc[key] = { user_name: a.user_name, items: [] };
    acc[key].items.push({ ...a, idx });
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Weekly Planner</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Assign workers to cells for the week</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-1.5 h-8 px-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </div>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Assignment
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
        <button
          onClick={() => setWeekStart(prev => subWeeks(prev, 1))}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-foreground">
            {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 4), 'd MMM yyyy')}
          </div>
          {isCurrentWeek && (
            <div className="text-[10px] font-medium text-primary mt-0.5">Current Week</div>
          )}
        </div>
        <button
          onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Assignments list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-card border border-border rounded-xl px-4 py-10 text-center">
          <p className="text-xs text-muted-foreground">No assignments for this week yet.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(byUser).map(({ user_name, items }) => (
            <div key={user_name} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* User header */}
              <div className="px-4 py-2.5 bg-muted/30 flex items-center gap-2 border-b border-border">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">{user_name}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{items.length} cell{items.length !== 1 ? 's' : ''}</span>
              </div>
              {/* Cells for this user */}
              <div className="divide-y divide-border/50">
                {items.map(a => (
                  <div key={a.idx} className="px-4 py-2.5 flex items-center gap-3">
                    <SquareDashedBottom className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-xs text-foreground truncate">
                      {a.cell_area ? `${a.cell_area} — ` : ''}{a.cell_name}
                    </span>
                    <button
                      onClick={() => handleRemove(a.idx)}
                      className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddAssignmentModal
          cells={cells}
          users={users}
          assignments={assignments}
          onAddMultiple={handleAddAssignment}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}