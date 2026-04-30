import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, UserCheck, Loader2, User } from 'lucide-react';

export default function AssignUserModal({ cell, onClose, onAssigned }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.functions.invoke('getUsers', {}).then(res => {
      const all = res?.data?.users || [];
      // Exclude users already on this cell or on a completed cell
      setUsers(all.filter(u => u.role === 'user'));
      setLoading(false);
    });
  }, []);

  async function handleAssign() {
    if (!selectedUserId) return;
    setSaving(true);
    await base44.functions.invoke('reassignUserCell', { userId: selectedUserId, newCellId: cell.id });
    const user = users.find(u => u.id === selectedUserId);
    onAssigned?.(user, cell);
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
            <h3 className="font-semibold text-foreground text-sm">Assign User to Cell</h3>
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
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Select User</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {users.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No users found.</p>
                  )}
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        selectedUserId === u.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{u.full_name || u.email}</div>
                        {u.active_cell_id && (
                          <div className="text-[10px] text-orange-500 font-medium">Currently on another cell</div>
                        )}
                      </div>
                      {selectedUserId === u.id && (
                        <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                The user will be signed into this cell and notified by email.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedUserId || saving}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}