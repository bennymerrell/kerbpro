import { useEffect, useRef } from 'react';
import { Info, Shapes, MousePointerClick, FlaskConical, List, SquareDashedBottom, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Species', 'Parking', 'Hydrant', 'Map Support', 'Public Toilet', 'Cafe'];

export default function IOSNavSheet({
  open, onClose,
  isSpeciesMode, onToggleSpeciesMode,
  isAreaMode, onToggleAreaMode,
  isPlotting, onTogglePlotting,
  activeCategories, onChangeCategories,
}) {
  const navigate = useNavigate();
  const sheetRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose]);

  if (!open) return null;

  function navAndClose(path) { onClose(); navigate(path); }

  const toolItems = [
    { label: 'Spotted', icon: Info, active: isSpeciesMode, color: 'text-blue-500', activeBg: 'bg-blue-500', inactiveBg: 'bg-blue-100', action: () => { onToggleSpeciesMode(); onClose(); } },
    { label: 'Draw Cell', icon: Shapes, active: isAreaMode, color: 'text-indigo-500', activeBg: 'bg-indigo-500', inactiveBg: 'bg-indigo-100', action: () => { onToggleAreaMode(); onClose(); } },
    { label: 'Plot Route', icon: MousePointerClick, active: isPlotting, color: 'text-emerald-500', activeBg: 'bg-emerald-500', inactiveBg: 'bg-emerald-100', action: () => { onTogglePlotting(); onClose(); } },
  ];

  const pageItems = [
    { label: 'Chemical Logs', icon: FlaskConical, path: '/chemical-logs', bg: 'bg-orange-500' },
    { label: 'Sightings', icon: List, path: '/sightings', bg: 'bg-green-500' },
    { label: 'Cells', icon: SquareDashedBottom, path: '/cells', bg: 'bg-blue-500' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full rounded-t-2xl bg-background shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(85vh - env(safe-area-inset-top, 0px))' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-base font-semibold text-foreground">Menu</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>

          {/* Map Tools */}
          <div className="px-4 mb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Map Tools</div>
            <div className="bg-muted/40 rounded-2xl overflow-hidden divide-y divide-border/60">
              {toolItems.map(({ label, icon: Icon, active, color, activeBg, inactiveBg, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${active ? 'bg-primary/5' : 'hover:bg-muted/60'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? activeBg : inactiveBg}`}>
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : color}`} />
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Data Pages */}
          <div className="px-4 mb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Data</div>
            <div className="bg-muted/40 rounded-2xl overflow-hidden divide-y divide-border/60">
              {pageItems.map(({ label, icon: Icon, path, bg }) => (
                <button
                  key={path}
                  onClick={() => navAndClose(path)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/60 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="ml-auto text-muted-foreground">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sightings Filter */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sightings Filter</div>
              <button
                onClick={() => onChangeCategories(activeCategories.length === CATEGORIES.length ? [] : [...CATEGORIES])}
                className="text-xs text-primary font-medium"
              >
                {activeCategories.length === CATEGORIES.length ? 'Hide all' : 'Show all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const on = activeCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => onChangeCategories(on ? activeCategories.filter(c => c !== cat) : [...activeCategories, cat])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}