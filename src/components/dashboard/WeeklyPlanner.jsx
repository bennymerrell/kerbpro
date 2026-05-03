import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2, Plus, X, User, SquareDashedBottom } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getMonday(date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function weekKey(date) {
  return format(date, 'yyyy-MM-dd');
}

function AddAssignmentModal({ cells, users, onAdd, onClose }) {
  const [userId, setUserId] = useState('');
  const [cellId, setCellId] = useState('');
  const [day, setDay] = useState(0);

  function handleAdd() {
    const user = users.find(u => u.id === userId);
    const cell = cells.find(c => c.id === cellId);
    if (!user || !cell) return;
    onAdd({
      user_id: user.id,
      user_name: user.full_name || user.email,
      cell_id: cell.id,
      cell_name: cell.name || 'Unnamed',
      cell_area: cell.area || '',
      day,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Add Assignment</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Day</label>
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setDay(i)}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium transition-colors ${day === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Worker</label>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select a worker —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Cell</label>
            <select
              value={cellId}
              onChange={e => setCellId(e.target.value)}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select a cell —</option>
              {cells.map(c => <option key={c.id} value={c.id}>{c.area ? `${c.area} — ` : ''}{c.name || 'Unnamed'}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={!userId || !cellId}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyPlanner() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [plan, setPlan] = useState(null); // WeeklyPlan entity record or null
  const [assignments, setAssignments] = useState([]); // parsed array
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

  function handleAddAssignment(assignment) {
    const next = [...assignments, assignment];
    setAssignments(next);
    saveAssignments(next);
  }

  function handleRemove(idx) {
    const next = assignments.filter((_, i) => i !== idx);
    setAssignments(next);
    saveAssignments(next);
  }

  const isCurrentWeek = weekKey(weekStart) === weekKey(getMonday(new Date()));

  // Group assignments by day
  const byDay = DAYS.map((_, i) => assignments.filter(a => a.day === i));

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Weekly Planner</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Assign workers to cells for each day</p>
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

      {/* Plan grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day, i) => {
            const date = addDays(weekStart, i);
            const dayAssignments = byDay[i];
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return (
              <div key={day} className={`bg-card border rounded-xl overflow-hidden ${isToday ? 'border-primary/40' : 'border-border'}`}>
                {/* Day header */}
                <div className={`px-4 py-2.5 flex items-center justify-between ${isToday ? 'bg-primary/5' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</span>
                    <span className="text-[11px] text-muted-foreground">{format(date, 'd MMM')}</span>
                    {isToday && <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">Today</span>}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{dayAssignments.length} assignment{dayAssignments.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Assignments */}
                <div className="divide-y divide-border/50">
                  {dayAssignments.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground italic">No assignments</div>
                  ) : (
                    dayAssignments.map((a, idx) => {
                      const globalIdx = assignments.indexOf(a);
                      return (
                        <div key={idx} className="px-4 py-2.5 flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{a.user_name}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <SquareDashedBottom className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-[11px] text-muted-foreground truncate">
                                {a.cell_area ? `${a.cell_area} — ` : ''}{a.cell_name}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemove(globalIdx)}
                            className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !plan && assignments.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No plan saved for this week yet. Add assignments and save.
        </div>
      )}

      {showAdd && (
        <AddAssignmentModal
          cells={cells}
          users={users}
          onAdd={handleAddAssignment}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}