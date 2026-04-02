import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trash2, Eye, MapPin, SquareDashedBottom, FlaskConical } from 'lucide-react';

const SECTIONS = [
  { key: 'sightings', label: 'Sightings', icon: MapPin, color: 'text-green-600 bg-green-100' },
  { key: 'cells', label: 'Cells', icon: SquareDashedBottom, color: 'text-indigo-600 bg-indigo-100' },
  { key: 'chemical_logs', label: 'Chemical Logs', icon: FlaskConical, color: 'text-orange-600 bg-orange-100' },
];

function SightingRow({ item, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{item.species || '—'}</div>
        <div className="text-[11px] text-muted-foreground">{item.lat?.toFixed(4)}, {item.lng?.toFixed(4)} · {item.reported_by || 'Unknown'}</div>
      </div>
      <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function CellRow({ item, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{item.name || 'Unnamed'}</div>
        <div className="text-[11px] text-muted-foreground">{item.area || '—'} · {item.visible ? 'Visible' : 'Hidden'}</div>
      </div>
      <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ChemRow({ item, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground">w/c {item.week_start}</div>
        <div className="text-[11px] text-muted-foreground">{item.created_by || '—'}</div>
      </div>
      <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function DataManagement() {
  const [activeSection, setActiveSection] = useState('sightings');
  const [data, setData] = useState({ sightings: [], cells: [], chemical_logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Sighting.list('-created_date', 200),
      base44.entities.Cell.list('-created_date', 200),
      base44.entities.ChemicalLog.list('-week_start', 200),
    ]).then(([sightings, cells, chemical_logs]) => {
      setData({ sightings, cells, chemical_logs });
      setLoading(false);
    });
  }, []);

  async function handleDelete(section, id) {
    const entityMap = { sightings: 'Sighting', cells: 'Cell', chemical_logs: 'ChemicalLog' };
    await base44.entities[entityMap[section]].delete(id);
    setData(prev => ({ ...prev, [section]: prev[section].filter(i => i.id !== id) }));
  }

  const items = data[activeSection] || [];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Data Management</h2>

      {/* Section tabs */}
      <div className="flex gap-2">
        {SECTIONS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeSection === key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeSection === key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              {data[key]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-10">No records found.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
          {activeSection === 'sightings' && items.map(i => <SightingRow key={i.id} item={i} onDelete={id => handleDelete('sightings', id)} />)}
          {activeSection === 'cells' && items.map(i => <CellRow key={i.id} item={i} onDelete={id => handleDelete('cells', id)} />)}
          {activeSection === 'chemical_logs' && items.map(i => <ChemRow key={i.id} item={i} onDelete={id => handleDelete('chemical_logs', id)} />)}
        </div>
      )}
    </div>
  );
}