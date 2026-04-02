import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function DrawerPicker({ value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between gap-1 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none select-none ${className}`}
      >
        <span>{value}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[4000] flex items-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full bg-white rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="px-4 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Select Unit
            </div>
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors select-none"
              >
                <span>{opt}</span>
                {value === opt && <Check className="h-4 w-4 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}