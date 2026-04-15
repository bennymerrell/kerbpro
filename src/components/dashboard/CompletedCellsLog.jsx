import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_LABELS = {
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  not_started: { label: 'Not Started', color: 'bg-blue-100 text-blue-700' },
};

export default function CompletedCellsLog() {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Cell.list('-completed_at', 200).then(data => {
      setCells(data);
      setLoading(false);
    });
  }, []);

  const completedCells = cells.filter(c => c.work_status === 'completed' && c.completed_at);
  const inProgress = cells.filter(c => c.work_status === 'in_progress');
  const notStarted = cells.filter(c => !c.work_status || c.work_status === 'not_started');

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Cell Status Overview</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{cells.length} total cells</p>
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

      {/* Completed log */}
      {completedCells.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completion Log</span>
          </div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
            {completedCells.map(cell => (
              <div key={cell.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{cell.name || 'Unnamed Cell'}</div>
                  {cell.area && <div className="text-[10px] text-muted-foreground">{cell.area}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] font-medium text-green-700">
                    {format(new Date(cell.completed_at), 'dd MMM yyyy')}
                  </div>
                  {cell.completed_by && (
                    <div className="text-[10px] text-muted-foreground">{cell.completed_by}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All cells status list */}
      {(inProgress.length > 0 || notStarted.length > 0) && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Cells</div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
            {[...inProgress, ...notStarted].map(cell => {
              const s = STATUS_LABELS[cell.work_status] || STATUS_LABELS.not_started;
              return (
                <div key={cell.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{cell.name || 'Unnamed Cell'}</div>
                    {cell.area && <div className="text-[10px] text-muted-foreground">{cell.area}</div>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}