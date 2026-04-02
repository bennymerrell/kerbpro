import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { key: 'cells', label: 'Cells', description: 'Draw and manage map cells' },
  { key: 'sightings', label: 'Spotted', description: 'Log and view sightings on the map' },
  { key: 'chemical_logs', label: 'Chemical Logs', description: 'Record weekly chemical usage' },
];

const ROLES = ['manager', 'user'];

const ROLE_LABELS = {
  manager: 'Manager',
  user: 'User',
};

const ACTIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_delete', label: 'Delete' },
];

const DEFAULT_PERMISSIONS = {
  manager: { cells: { can_view: true, can_create: true, can_delete: true }, sightings: { can_view: true, can_create: true, can_delete: true }, chemical_logs: { can_view: true, can_create: true, can_delete: true } },
  user:    { cells: { can_view: true, can_create: false, can_delete: false }, sightings: { can_view: true, can_create: true, can_delete: false }, chemical_logs: { can_view: true, can_create: false, can_delete: false } },
};

export default function PermissionsPage() {
  // perms[role][feature] = { can_view, can_create, can_delete, id? }
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.RolePermissions.list().then(records => {
      if (records.length > 0) {
        const built = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
        records.forEach(r => {
          if (!built[r.role]) built[r.role] = {};
          built[r.role][r.feature] = {
            can_view: r.can_view ?? true,
            can_create: r.can_create ?? false,
            can_delete: r.can_delete ?? false,
            id: r.id,
          };
        });
        setPerms(built);
      }
      setLoading(false);
    });
  }, []);

  function toggle(role, feature, action) {
    setPerms(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [feature]: {
          ...prev[role][feature],
          [action]: !prev[role][feature][action],
        },
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    // Upsert all role/feature combos
    for (const role of ROLES) {
      for (const { key: feature } of FEATURES) {
        const p = perms[role][feature];
        const data = { role, feature, can_view: !!p.can_view, can_create: !!p.can_create, can_delete: !!p.can_delete };
        if (p.id) {
          await base44.entities.RolePermissions.update(p.id, data);
        } else {
          const created = await base44.entities.RolePermissions.create(data);
          setPerms(prev => ({
            ...prev,
            [role]: { ...prev[role], [feature]: { ...prev[role][feature], id: created.id } },
          }));
        }
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Role Permissions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Control what each role can do</p>
          </div>
          <Link to="/settings" className="text-sm text-primary hover:underline">← Settings</Link>
        </div>

        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <strong>Admin</strong> always has full access to everything. Configure <strong>Manager</strong> and <strong>User</strong> permissions below.
        </p>

        {/* Permission grid per role */}
        {ROLES.map(role => (
          <div key={role} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{ROLE_LABELS[role]}</span>
            </div>

            <div className="divide-y divide-border">
              {FEATURES.map(({ key: feature, label, description }) => (
                <div key={feature} className="px-5 py-4">
                  <div className="mb-3">
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ACTIONS.map(({ key: action, label: aLabel }) => {
                      const checked = !!perms[role]?.[feature]?.[action];
                      // view cannot be unchecked if create/delete is on
                      const disabled = action === 'can_view' && (perms[role]?.[feature]?.can_create || perms[role]?.[feature]?.can_delete);
                      return (
                        <label
                          key={action}
                          className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div
                            onClick={() => !disabled && toggle(role, feature, action)}
                            className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                          <span className="text-xs font-medium text-foreground">{aLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
}