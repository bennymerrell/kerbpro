import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Pencil, Trash2, X, Check, FileText } from 'lucide-react';

function ContractModal({ contract, onClose, onSave }) {
  const [name, setName] = useState(contract?.name || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">{contract ? 'Edit Contract' : 'New Contract'}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">Contract Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. North District"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {contract ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContractManagement() {
  const [contractRecords, setContractRecords] = useState([]); // Contract entity records
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | contract record
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Contract.list('name', 200),
      base44.entities.Cell.list('-created_date', 500),
    ]).then(([contractData, cellData]) => {
      setCells(cellData);

      // Merge: existing Contract records + any area strings not yet in Contract records
      const recordNames = new Set(contractData.map(c => c.name));
      const cellAreaNames = [...new Set(cellData.map(c => c.area).filter(Boolean))];
      const missing = cellAreaNames.filter(a => !recordNames.has(a));

      // Create Contract records for any orphaned cell areas
      Promise.all(missing.map(name => base44.entities.Contract.create({ name }))).then(created => {
        setContractRecords([...contractData, ...created].sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      });

      if (missing.length === 0) {
        setContractRecords(contractData.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      }
    });
  }, []);

  function cellCountForContract(name) {
    return cells.filter(c => c.area === name).length;
  }

  async function handleSave(newName, existingRecord) {
    if (existingRecord) {
      // Rename: update Contract record + all cells with old name
      await base44.entities.Contract.update(existingRecord.id, { name: newName });
      const affected = cells.filter(c => c.area === existingRecord.name);
      await Promise.all(affected.map(c => base44.entities.Cell.update(c.id, { area: newName })));
      setCells(prev => prev.map(c => c.area === existingRecord.name ? { ...c, area: newName } : c));
      setContractRecords(prev =>
        prev.map(r => r.id === existingRecord.id ? { ...r, name: newName } : r)
            .sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      // Create new Contract record — persists in DB
      const created = await base44.entities.Contract.create({ name: newName });
      setContractRecords(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  async function handleDelete(record) {
    const count = cellCountForContract(record.name);
    if (!window.confirm(`Delete contract "${record.name}"? This will remove the contract label from ${count} cell(s). The cells themselves will not be deleted.`)) return;
    setDeletingId(record.id);
    const affected = cells.filter(c => c.area === record.name);
    await Promise.all([
      base44.entities.Contract.delete(record.id),
      ...affected.map(c => base44.entities.Cell.update(c.id, { area: '' })),
    ]);
    setCells(prev => prev.map(c => c.area === record.name ? { ...c, area: '' } : c));
    setContractRecords(prev => prev.filter(r => r.id !== record.id));
    setDeletingId(null);
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Contract Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{contractRecords.length} contract{contractRecords.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Contract
        </button>
      </div>

      {contractRecords.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No contracts yet. Create your first one.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
          {contractRecords.map(record => (
            <div key={record.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{record.name}</div>
                <div className="text-[11px] text-muted-foreground">{cellCountForContract(record.name)} cell{cellCountForContract(record.name) !== 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={() => setModal(record)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(record)}
                disabled={deletingId === record.id}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
              >
                {deletingId === record.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ContractModal
          contract={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (newName) => {
            await handleSave(newName, modal === 'new' ? null : modal);
          }}
        />
      )}
    </div>
  );
}