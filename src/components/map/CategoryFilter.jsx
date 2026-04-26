import { useState } from 'react';
import { Filter } from 'lucide-react';
import { cn } from "@/lib/utils";

const CATEGORIES = ['Species', 'Free Parking', 'Hydrant', 'WO Point', 'Public Toilet', 'Cafe / Van'];

const CATEGORY_COLORS = {
  'Species':      'bg-green-100 text-green-700 border-green-300',
  'Free Parking': 'bg-blue-100 text-blue-700 border-blue-300',
  'Hydrant':      'bg-red-100 text-red-700 border-red-300',
  'WO Point':     'bg-sky-100 text-sky-600 border-sky-300',
  'Public Toilet':'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Cafe / Van':   'bg-orange-100 text-orange-700 border-orange-300',
};

export default function CategoryFilter({ activeCategories, onChange }) {
  const [open, setOpen] = useState(false);

  function toggleCategory(cat) {
    if (activeCategories.includes(cat)) {
      onChange(activeCategories.filter(c => c !== cat));
    } else {
      onChange([...activeCategories, cat]);
    }
  }

  function toggleAll() {
    if (activeCategories.length === CATEGORIES.length) {
      onChange([]);
    } else {
      onChange([...CATEGORIES]);
    }
  }

  const hiddenCount = CATEGORIES.length - activeCategories.length;

  return (
    <div className="absolute top-28 right-4 z-[1000]">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-2.5 flex items-center gap-1.5 text-xs font-medium transition-all",
          hiddenCount > 0 ? "text-primary border-primary/40" : "text-foreground hover:bg-muted/80"
        )}
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filter</span>
        {hiddenCount > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full text-[10px] font-bold px-1.5 py-0.5 leading-none">
            {hiddenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-3 w-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Categories</span>
            <button onClick={toggleAll} className="text-[10px] text-primary hover:underline font-medium">
              {activeCategories.length === CATEGORIES.length ? 'Hide all' : 'Show all'}
            </button>
          </div>
          <div className="space-y-1.5">
            {CATEGORIES.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={activeCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="hidden"
                />
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  activeCategories.includes(cat) ? "bg-primary border-primary" : "border-border"
                )}>
                  {activeCategories.includes(cat) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded border font-medium",
                  CATEGORY_COLORS[cat] || 'bg-muted text-foreground border-border'
                )}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}