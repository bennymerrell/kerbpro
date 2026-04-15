import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Pencil, X, Check, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function LastSeenBadge({ lastSeen }) {
  if (!lastSeen) return <span className="text-[10px] text-muted-foreground/50">Never</span>;
  const date = new Date(lastSeen);
  const diffMs = Date.now() - date.getTime();
  const isOnline = diffMs < 5 * 60 * 1000; // within 5 minutes
  const isRecent = diffMs < 60 * 60 * 1000; // within 1 hour
  return (
    <div className="flex items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500' : isRecent ? 'bg-amber-400' : 'bg-gray-300'}`} />
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {isOnline ? 'Online' : formatDistanceToNow(date, { addSuffix: true })}
      </span>
    </div>
  );
}

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  user: 'bg-gray-100 text-gray-600',
};

function EditUserModal({ user: u, onClose, onSave }) {
  const [form, setForm] = useState({ full_name: u.full_name || '', role: u.role || 'user' });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await base44.entities.User.update(u.id, form);
    onSave({ ...u, ...form });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Edit User</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Email</label>
            <input type="text" value={u.email} disabled className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-muted text-muted-foreground" />
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

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    base44.entities.User.list().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  function handleSave(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">User Management</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{users.length} registered users</p>
      </div>
      <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
        {users.map(u => {
          const isAdmin = u.role === 'admin';
          return (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{u.full_name || '—'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                <LastSeenBadge lastSeen={u.last_seen} />
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                {u.role || 'user'}
              </span>
              {isAdmin ? (
                <div className="p-1.5 text-muted-foreground/40" title="Admin accounts cannot be edited">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              ) : (
                <button onClick={() => setEditing(u)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}