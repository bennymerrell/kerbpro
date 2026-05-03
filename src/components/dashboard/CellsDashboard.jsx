import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Pencil, Trash2, X, Check, RotateCcw, User, Search, RefreshCw, UserCheck, UserPlus, CalendarDays } from 'lucide-react';
import AssignUserModal from '@/components/cells/AssignUserModal';
import { format, startOfWeek } from 'date-fns';

function getThisWeekKey() {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

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

function ReassignUserModal({ user, cells, onClose, onReassigned }) {
  const [selectedCellId, setSelectedCellId] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleReassign() {
    if (!selectedCellId) return;
    setSaving(true);
    await base44.functions.invoke('reassignUserCell', { userId: user.id, newCellId: selectedCellId });
    onReassigned(user.id, selectedCellId);
    setSaving(false);
    onClose();
  }

  const availableCells = cells.filter(c => c.work_status !== 'completed');

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Reassign User</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{user.full_name || user.email}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">New Cell</label>
            <select
              value={selectedCellId}
              onChange={e => setSelectedCellId(e.target.value)}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select a cell —</option>
              {availableCells.map(c => (
                <option key={c.id} value={c.id}>{c.area ? `${c.area} — ` : ''}{c.name || 'Unnamed'}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-muted-foreground">The user will receive an email notification and their active cell will be updated.</p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">Cancel</button>
          <button onClick={handleReassign} disabled={saving || !selectedCellId} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CellsDashboard() {
  const [cells, setCells] = useState([]);
  const [offices, setOffices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [reassigning, setReassigning] = useState(null); // user being reassigned
  const [assigningCell, setAssigningCell] = useState(null); // cell to assign a new user to
  const [filterArea, setFilterArea] = useState('');
  const [filterOffice, setFilterOffice] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [search, setSearch] = useState('');
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [weeklyAssignments, setWeeklyAssignments] = useState([]);

  async function handleBatchRecalc() {
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const res = await base44.functions.invoke('batchMileageRecalc', {});
      setBatchResult(res?.data || { ok: true });
    } catch (e) {
      setBatchResult({ error: e.message });
    } finally {
      setBatchRunning(false);
    }
  }

  useEffect(() => {
    Promise.all([
      base44.entities.Cell.list('-completed_at', 200),
      base44.entities.Office.list(),
      base44.functions.invoke('getUsers', {}),
      base44.entities.WeeklyPlan.filter({ week_start: getThisWeekKey() }),
    ]).then(([cellData, officeData, usersRes, plans]) => {
      setCells(cellData);
      setOffices(officeData);
      setUsers(usersRes?.data?.users || []);
      try {
        const plan = plans[0];
        setWeeklyAssignments(plan ? JSON.parse(plan.assignments || '[]') : []);
      } catch { setWeeklyAssignments([]); }
      setLoading(false);
    });
  }, []);

  // Build a map of cell_id -> [user_names] from this week's plan
  const weeklyByCellId = useMemo(() => {
    return weeklyAssignments.reduce((acc, a) => {
      if (!acc[a.cell_id]) acc[a.cell_id] = [];
      acc[a.cell_id].push(a.user_name);
      return acc;
    }, {});
  }, [weeklyAssignments]);

  async function handleDelete(id) {
    await base44.entities.Cell.delete(id);
    setCells(prev => prev.filter(c => c.id !== id));
  }

  async function handleResetCell(cell) {
    setResettingId(cell.id);
    try {
      await base44.functions.invoke('managerResetCell', { cellId: cell.id });
      setCells(prev => prev.map(c => c.id === cell.id
        ? { ...c, work_status: 'not_started', completed_at: null, completed_by: null }
        : c
      ));
      // Remove all users from this cell in local state
      setUsers(prev => prev.map(u => u.active_cell_id === cell.id ? { ...u, active_cell_id: '' } : u));
    } finally {
      setResettingId(null);
    }
  }

  function handleSave(updated) {
    setCells(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  function handleReassigned(userId, newCellId) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active_cell_id: newCellId } : u));
    // Mark new cell as in_progress if needed
    setCells(prev => prev.map(c => c.id === newCellId && c.work_status !== 'in_progress'
      ? { ...c, work_status: 'in_progress' }
      : c
    ));
  }

  function cellUsers(cellId) {
    return users.filter(u => u.active_cell_id === cellId);
  }

  const areas = [...new Set(cells.map(c => c.area).filter(Boolean))].sort();
  const officeMap = Object.fromEntries(offices.map(o => [o.id, o.name]));
  const filteredCells = cells.filter(c => {
    const matchesArea = !filterArea || c.area === filterArea;
    const matchesOffice = !filterOffice || c.office_id === filterOffice;
    const matchesSearch = !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.area || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesArea || !matchesOffice || !matchesSearch) return false;
    if (filterUser) {
      // Check active (checked-in) users
      const isActive = users.some(u => u.id === filterUser && u.active_cell_id === c.id);
      // Check weekly plan assignments
      const isWeekly = (weeklyByCellId[c.id] || []).some(() => {
        const wa = weeklyAssignments.find(a => a.cell_id === c.id && a.user_id === filterUser);
        return !!wa;
      });
      const weeklyMatch = weeklyAssignments.some(a => a.cell_id === c.id && a.user_id === filterUser);
      // Check pre-assigned
      let assignedIds = [];
      try { assignedIds = JSON.parse(c.assigned_user_ids || '[]'); } catch {}
      const isAssigned = assignedIds.includes(filterUser);
      return isActive || weeklyMatch || isAssigned;
    }
    return true;
  });

  const completedCells = filteredCells.filter(c => c.work_status === 'completed' && c.completed_at);
  const inProgress = filteredCells.filter(c => c.work_status === 'in_progress');
  const notStarted = filteredCells.filter(c => !c.work_status || c.work_status === 'not_started');

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Cell Status Overview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredCells.length} of {cells.length} cells</p>
          </div>
          <button
            onClick={handleBatchRecalc}
            disabled={batchRunning}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {batchRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {batchRunning ? 'Running…' : 'Recalc All Miles'}
          </button>
        </div>
        {batchResult && (
          <div className={`text-xs px-3 py-2 rounded-lg ${batchResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {batchResult.error
              ? `Error: ${batchResult.error}`
              : `Done — ${batchResult.processed ?? 0} processed, ${batchResult.errors ?? 0} errors, ${batchResult.skipped ?? 0} skipped`
            }
          </div>
        )}
        <div className="space-y-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cells…"
              className="w-full text-xs border border-input rounded-lg pl-8 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {offices.length > 0 && (
              <select
                value={filterOffice}
                onChange={e => { setFilterOffice(e.target.value); setFilterArea(''); }}
                className="text-xs border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0"
              >
                <option value="">All Offices</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
            {areas.length > 0 && (
              <select
                value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
                className="text-xs border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-0"
              >
                <option value="">All Areas</option>
                {(filterOffice
                  ? [...new Set(cells.filter(c => c.office_id === filterOffice).map(c => c.area).filter(Boolean))].sort()
                  : areas
                ).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            {users.filter(u => u.role === 'user').length > 0 && (
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="text-xs border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
              >
                <option value="">All Workers</option>
                {users.filter(u => u.role === 'user').map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            )}
          </div>
        </div>
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
            const checkedInUsers = cellUsers(cell.id);
            const isResetting = resettingId === cell.id;
            return (
              <div key={cell.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCompleted ? 'bg-green-500' : cell.work_status === 'in_progress' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{cell.name || 'Unnamed Cell'}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {[officeMap[cell.office_id], cell.area].filter(Boolean).join(' · ') || '—'}
                    </div>
                    {isCompleted && (
                      <div className="text-[10px] text-green-600 font-medium mt-0.5">
                        ✓ {format(new Date(cell.completed_at), 'dd MMM yyyy')}{cell.completed_by ? ` · ${cell.completed_by}` : ''}
                        {cell.adopted_m != null ? ` · ${Math.round(((cell.adopted_m) / 1609.34) * 2)} mi spray` : ''}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                  {/* Reset button — available on any non-not_started cell */}
                  {cell.work_status && cell.work_status !== 'not_started' && (
                    <button
                      onClick={() => handleResetCell(cell)}
                      disabled={isResetting}
                      title="Reset cell (logs out all users if in progress)"
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  <button onClick={() => setAssigningCell(cell)} title="Assign a user to this cell" className="p-1.5 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 transition-colors flex-shrink-0">
                    <UserPlus className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditing(cell)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cell.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {(() => {
                  const activeUsers = checkedInUsers;
                  let assignedIds = [];
                  try { assignedIds = JSON.parse(cell.assigned_user_ids || '[]'); } catch {}
                  const assignedNotActive = users.filter(u =>
                    assignedIds.includes(u.id) && u.active_cell_id !== cell.id
                  );
                  const weeklyUsers = weeklyByCellId[cell.id] || [];
                  if (activeUsers.length === 0 && assignedNotActive.length === 0 && weeklyUsers.length === 0) return null;
                  return (
                    <div className="ml-5 mt-2 space-y-1.5">
                      {activeUsers.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Working</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeUsers.map(u => (
                              <button
                                key={u.id}
                                onClick={() => setReassigning(u)}
                                title="Reassign this user to a different cell"
                                className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 hover:bg-orange-100 hover:border-orange-300 transition-colors"
                              >
                                <User className="h-2.5 w-2.5 text-orange-500 flex-shrink-0" />
                                <span className="text-[10px] font-medium text-orange-700">{u.full_name || u.email}</span>
                                <UserCheck className="h-2.5 w-2.5 text-orange-400 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {assignedNotActive.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Assigned</span>
                          <div className="flex flex-wrap gap-1.5">
                            {assignedNotActive.map(u => (
                              <div
                                key={u.id}
                                title="Assigned but not yet started"
                                className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5"
                              >
                                <User className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                                <span className="text-[10px] font-medium text-gray-500">{u.full_name || u.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {weeklyByCellId[cell.id]?.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide">This Week's Plan</span>
                          <div className="flex flex-wrap gap-1.5">
                            {weeklyByCellId[cell.id].map((name, i) => (
                              <div key={i} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                                <CalendarDays className="h-2.5 w-2.5 text-indigo-400 flex-shrink-0" />
                                <span className="text-[10px] font-medium text-indigo-700">{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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

      {reassigning && (
        <ReassignUserModal
          user={reassigning}
          cells={cells}
          onClose={() => setReassigning(null)}
          onReassigned={handleReassigned}
        />
      )}

      {assigningCell && (
        <AssignUserModal
          cell={assigningCell}
          onClose={() => setAssigningCell(null)}
          onAssigned={(selectedIds, cell) => {
            setCells(prev => prev.map(c => c.id === cell.id
              ? { ...c, assigned_user_ids: JSON.stringify(selectedIds) }
              : c
            ));
          }}
        />
      )}
    </div>
  );
}