import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Database, BarChart2, ArrowLeft, Loader2 } from 'lucide-react';
import UserManagement from '../components/dashboard/UserManagement';
import DataManagement from '../components/dashboard/DataManagement';
import Analytics from '../components/dashboard/Analytics';

const TABS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'data', label: 'Data', icon: Database },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('analytics');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <LayoutDashboard className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">This area is restricted to admins only.</p>
          <button onClick={() => navigate('/')} className="mt-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Admin Dashboard</span>
        </div>
        <span className="ml-auto text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border px-4 flex gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'analytics' && <Analytics />}
        {tab === 'users' && <UserManagement />}
        {tab === 'data' && <DataManagement />}
      </div>
    </div>
  );
}