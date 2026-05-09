import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Pencil, X, Check, Users, Bell, BellOff } from 'lucide-react';

function EditUserModal({ user, offices, users, onClose, onSave }) {
  const [form, setForm] = useState({
    role: user.role || 'user',
    office_id: user.office_id || '',
    manager_id: user.manager_id || '',
    phone: user.phone || '',
    communications_enabled: user.communications_enabled !== false,
  });
  const [saving, setSaving] = useState(false);

  const managers = users.filter(u => u.role === 'manager');

  async function handleSave() {
    setSaving(true);
    const res = await base44.functions.invoke('updateUser', { userId: user.id, data: form });
    onSave(res.data.user);
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
            <div className="text-xs font-medium text-foreground mb-0.5">{user.full_name || '—'}</div>
            <div className="text-[11px] text-muted-foreground">{user.email}</div>
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
              <option value="admin">Admin</option>
            </select>
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
          {form.role === 'user' && (
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Manager</label>
              <select
                value={form.manager_id}
                onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}
                className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— None —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Phone (SMS/WhatsApp notifications)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+447700900000"
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-medium text-muted-foreground">Communications</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, communications_enabled: !f.communications_enabled }))}
                className={`relative inline-flex h-6 w-10 rounded-full transition-colors ${
                  form.communications_enabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform transform ${
                    form.communications_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{form.communications_enabled ? 'Receiving emails & SMS' : 'All notifications disabled'}</p>
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
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.functions.invoke('getUsers', {}).then(r => r.data.users || []),
      base44.functions.invoke('manageOffice', { action: 'list' }).then(r => r.data.offices || []),
    ]).then(([u, o]) => {
      setUsers(u);
      setOffices(o);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleSaved(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
  }

  const officeMap = Object.fromEntries(offices.map(o => [o.id, o.name]));

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">User Management</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                </div>
                {u.active_cell_id && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground truncate">{u.full_name || u.email}</span>
                  {u.active_cell_id && <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Active</span>}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  <span className="capitalize">{u.role}</span>
                  {u.office_id && officeMap[u.office_id] ? ` · ${officeMap[u.office_id]}` : ''}
                </div>
              </div>
              <button onClick={() => setEditing(u)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditUserModal
          user={editing}
          offices={offices}
          users={users}
          onClose={() => setEditing(null)}
          onSave={handleSaved}
        />
      )}
    </div>
  );
}