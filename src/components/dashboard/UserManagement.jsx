import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Loader2, X } from 'lucide-react';

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  user: 'bg-gray-100 text-gray-600',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    base44.entities.User.list().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  async function handleRoleChange(userId, newRole) {
    setUpdating(userId);
    await base44.entities.User.update(userId, { role: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setUpdating(null);
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">User Management</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{users.length} registered users</p>
      </div>
      <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{u.full_name || '—'}</div>
              <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {updating === u.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                : (
                  <select
                    value={u.role || 'user'}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                )
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}