import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, UserCheck, Loader2, User, Check } from 'lucide-react';

export default function AssignUserModal({ cell, onClose, onAssigned }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Parse existing assigned user IDs from the cell
  const [selectedIds, setSelectedIds] = useState(() => {
    try { return JSON.parse(cell.assigned_user_ids || '[]'); } catch { return []; }
  });

  useEffect(() => {
    base44.functions.invoke('getUsers', {}).then(res => {
      setUsers((res?.data?.users || []).filter(u => u.role === 'user'));
      setLoading(false);
    });
  }, []);

  function toggleUser(userId) {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  async function handleSave() {
    setSaving(true);
    await base44.entities.Cell.update(cell.id, {
      assigned_user_ids: JSON.stringify(selectedIds),
    });
    onAssigned?.(selectedIds, cell);
    setSaving(false);
    onClose();
  }

  const cellDesc = [cell.area, cell.name || 'Unnamed Cell'].filter(Boolean).join(' — ');

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Assign Users to Cell</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{cellDesc}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Select Users (tap to toggle)</label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {users.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No users found.</p>
                  )}
                  {users.map(u => {
                    const isSelected = selectedIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary' : 'bg-muted'}`}>
                          {isSelected
                            ? <Check className="h-3.5 w-3.5 text-white" />
                            : <User className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">{u.full_name || u.email}</div>
                        </div>
                        {isSelected && (
                          <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Assigned users will appear on this cell. They are only shown as active (orange) once they log in and start the cell.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}