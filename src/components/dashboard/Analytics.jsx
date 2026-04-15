import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, MapPin, SquareDashedBottom, FlaskConical, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Sighting.list('-created_date', 500),
      base44.entities.Cell.list('-created_date', 200),
      base44.entities.ChemicalLog.list('-week_start', 200),
      base44.functions.invoke('getUsers', {}).then(r => r.data.users || []),
    ]).then(([s, c, l, u]) => {
      const sightings = s.status === 'fulfilled' ? s.value : [];
      const cells = c.status === 'fulfilled' ? c.value : [];
      const logs = l.status === 'fulfilled' ? l.value : [];
      const users = u.status === 'fulfilled' ? u.value : [];
      // Sightings by category
      const categoryMap = {};
      sightings.forEach(s => {
        const cat = s.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
      const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

      // Sightings over last 8 weeks
      const weekMap = {};
      sightings.forEach(s => {
        if (!s.created_date) return;
        const d = new Date(s.created_date);
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const key = monday.toISOString().split('T')[0];
        weekMap[key] = (weekMap[key] || 0) + 1;
      });
      const weekData = Object.entries(weekMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-8)
        .map(([date, count]) => ({ date: date.slice(5), count }));

      setStats({ sightings, cells, logs, users, categoryData, weekData });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const roleCount = { admin: 0, manager: 0, user: 0 };
  stats.users.forEach(u => { if (roleCount[u.role] !== undefined) roleCount[u.role]++; else roleCount.user++; });

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-foreground">Analytics Overview</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Sightings" value={stats.sightings.length} icon={MapPin} color="bg-green-100 text-green-600" />
        <StatCard label="Saved Cells" value={stats.cells.length} icon={SquareDashedBottom} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="Chemical Logs" value={stats.logs.length} icon={FlaskConical} color="bg-orange-100 text-orange-600" />
        <StatCard label="Registered Users" value={stats.users.length} icon={Users} color="bg-blue-100 text-blue-600" />
      </div>

      {/* Sightings over time */}
      {stats.weekData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-foreground mb-4">Sightings — Last 8 Weeks</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.weekData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Bar dataKey="count" name="Sightings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sightings by category */}
      {stats.categoryData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-foreground mb-4">Sightings by Category</div>
          <div className="space-y-2">
            {stats.categoryData.map(({ name, count }) => {
              const pct = Math.round((count / stats.sightings.length) * 100);
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 truncate">{name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User roles */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-xs font-semibold text-foreground mb-3">User Roles</div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(roleCount).map(([role, count]) => (
            <div key={role} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground capitalize">{count}</span> {role}s
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}