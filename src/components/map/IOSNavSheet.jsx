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
    { label: 'Spotted', icon: Info, active: isSpeciesMode, color: 'text-blue-500', bg: 'bg-blue-50', action: () => { onToggleSpeciesMode(); onClose(); } },
    { label: 'Draw Cell', icon: Shapes, active: isAreaMode, color: 'text-indigo-500', bg: 'bg-indigo-50', action: () => { onToggleAreaMode(); onClose(); } },
    { label: 'Plot Route', icon: MousePointerClick, active: isPlotting, color: 'text-blue-500', bg: 'bg-blue-50', action: () => { onTogglePlotting(); onClose(); } },
  ];

  const pageItems = [
    { label: 'Chemical Logs', icon: FlaskConical, path: '/chemical-logs' },
    { label: 'Sightings', icon: List, path: '/sightings' },
    { label: 'Cells', icon: SquareDashedBottom, path: '/cells' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full rounded-t-2xl bg-white/95 backdrop-blur-xl shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">Menu</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>

        {/* Map Tools */}
        <div className="px-4 mb-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Map Tools</div>
          <div className="flex gap-3">
            {toolItems.map(({ label, icon: Icon, active, color, bg, action }) => (
              <button
                key={label}
                onClick={action}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${active ? `${bg} ${color}` : 'bg-gray-50 text-gray-500'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium">{active ? 'Active' : label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pages */}
        <div className="px-4 mb-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Data</div>
          <div className="bg-gray-50 rounded-2xl overflow-hidden divide-y divide-gray-200/70">
            {pageItems.map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => navAndClose(path)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-100/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{label}</span>
                <span className="ml-auto text-gray-300">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sightings Filter */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sightings Filter</div>
            <button
              onClick={() => onChangeCategories(activeCategories.length === CATEGORIES.length ? [] : [...CATEGORIES])}
              className="text-xs text-blue-500 font-medium"
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${on ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}