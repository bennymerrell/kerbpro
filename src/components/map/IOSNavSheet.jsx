import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Info, Shapes, MousePointerClick, FlaskConical, List, SquareDashedBottom, X, Download, Loader2, LogOut, LayoutDashboard, PlayCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Species', 'Free Parking', 'Hydrant', 'WO Point', 'Public Toilet', 'Cafe / Van'];

export default function IOSNavSheet({
  open, onClose,
  onSpotted,
  isAreaMode, onToggleAreaMode,
  isPlotting, onTogglePlotting,
  activeCategories, onChangeCategories,
  cells = [],
  selectedCell = null,
  activeUserCell = null,
  onCellContinue,
  onCellFinish,
  onCellLogOff,
}) {
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose]);

  if (!open) return null;

  function navAndClose(path) { onClose(); navigate(path); }

  function handlePrintMap() {
    if (selectedCell) {
      navAndClose(`/print-map/${selectedCell.id}`);
    }
  }

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const toolItems = [
    { label: 'Spotted', icon: Info, active: false, color: 'text-blue-500', activeBg: 'bg-blue-500', inactiveBg: 'bg-blue-100', action: () => { base44.analytics.track({ eventName: 'nav_spotted_clicked' }); onSpotted(); onClose(); } },
    ...(isAdminOrManager ? [
      { label: 'Draw Cell', icon: Shapes, active: isAreaMode, color: 'text-indigo-500', activeBg: 'bg-indigo-500', inactiveBg: 'bg-indigo-100', action: () => { base44.analytics.track({ eventName: 'nav_draw_cell_clicked', properties: { activated: !isAreaMode } }); onToggleAreaMode(); onClose(); } },
      { label: 'Print Map', icon: Download, active: false, color: 'text-gray-500', activeBg: 'bg-gray-500', inactiveBg: 'bg-gray-100', action: () => { base44.analytics.track({ eventName: 'nav_print_map_clicked' }); handlePrintMap(); }, disabled: !selectedCell },
    ] : []),
  ];

  const pageItems = [
    { label: 'Sightings', icon: List, path: '/sightings', bg: 'bg-green-500', event: 'nav_sightings_clicked' },
    { label: 'Cells', icon: SquareDashedBottom, path: '/cells', bg: 'bg-blue-500', event: 'nav_cells_clicked' },
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
        <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)', WebkitOverflowScrolling: 'touch' }}>

          {/* Active Cell — always first if present */}
          {activeUserCell && (
            <div className="px-4 mb-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Active Cell</div>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <SquareDashedBottom className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-orange-800 truncate">{activeUserCell.name || 'Unnamed Cell'}</div>
                    {activeUserCell.area && <div className="text-xs text-orange-600">{activeUserCell.area}</div>}
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => { onCellContinue?.(); onClose(); }}
                    className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Continue This Cell
                  </button>
                  <button
                    onClick={() => { onCellFinish?.(); onClose(); }}
                    className="w-full h-9 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Finish & Start New Cell
                  </button>
                  <button
                    onClick={() => { onCellLogOff?.(); onClose(); }}
                    className="w-full h-9 rounded-xl bg-orange-100 text-orange-700 text-xs font-semibold hover:bg-orange-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log Off (Keep In Progress)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard — admin/manager only */}
          {isAdminOrManager && (
            <div className="px-4 mb-4">
              <button
                onClick={() => { base44.analytics.track({ eventName: 'nav_dashboard_clicked' }); navAndClose('/dashboard'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-primary/10 rounded-2xl text-left hover:bg-primary/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-primary">Dashboard</span>
                <span className="ml-auto text-primary">›</span>
              </button>
            </div>
          )}

          {/* Map Tools */}
          <div className="px-4 mb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Map Tools</div>
            <div className="bg-muted/40 rounded-2xl overflow-hidden divide-y divide-border/60">
              {toolItems.map(({ label, icon: Icon, active, color, activeBg, inactiveBg, action, disabled }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${active ? 'bg-primary/5' : 'hover:bg-muted/60'}`}
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
              {pageItems.map(({ label, icon: Icon, path, bg, event }) => (
                <button
                  key={path}
                  onClick={() => { base44.analytics.track({ eventName: event }); navAndClose(path); }}
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

          {/* Logout */}
          <div className="px-4 mb-4">
            <button
              onClick={() => { base44.analytics.track({ eventName: 'logout_clicked' }); base44.auth.logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-muted/40 rounded-2xl text-left hover:bg-red-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-sm font-medium text-red-500">Log Out</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}