import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Pencil, Trash2, X, Check, Building2 } from 'lucide-react';

function OfficeModal({ office, onClose, onSave }) {
  const [form, setForm] = useState({ name: office?.name || '', location: office?.location || '' });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const action = office ? 'update' : 'create';
    const res = await base44.functions.invoke('manageOffice', {
      action,
      officeId: office?.id,
      data: form,
    });
    onSave(res.data.office);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">{office ? 'Edit Office' : 'New Office'}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Office Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Birmingham North"
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Birmingham, UK"
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {office ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OfficeManagement({ userRole }) {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | 'new' | office object
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    base44.functions.invoke('manageOffice', { action: 'list' })
      .then(res => { setOffices(res.data.offices || []); setLoading(false); })
      .catch(err => { setError(err?.message || 'Failed to load offices'); setLoading(false); });
  }, []);

  function handleSaved(office) {
    setOffices(prev => {
      const exists = prev.find(o => o.id === office.id);
      return exists ? prev.map(o => o.id === office.id ? office : o) : [office, ...prev];
    });
  }

  async function handleDelete(office) {
    if (!window.confirm(`Delete office "${office.name}"? This cannot be undone.`)) return;
    setDeletingId(office.id);
    await base44.functions.invoke('manageOffice', { action: 'delete', officeId: office.id });
    setOffices(prev => prev.filter(o => o.id !== office.id));
    setDeletingId(null);
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-center py-10 text-sm text-destructive">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Office Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{offices.length} office{offices.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Office
        </button>
      </div>

      {offices.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No offices yet. Create your first one.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
          {offices.map(office => (
            <div key={office.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{office.name}</div>
                {office.location && <div className="text-[11px] text-muted-foreground truncate">{office.location}</div>}
              </div>
              <button onClick={() => setModal(office)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => handleDelete(office)}
                  disabled={deletingId === office.id}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                >
                  {deletingId === office.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <OfficeModal
          office={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSaved}
        />
      )}
    </div>
  );
}