import { Map, SquareDashedBottom, Leaf } from 'lucide-react';

export default function UserLandingChoice({ onViewMap, onStartCell }) {
  return (
    <div className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-5 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-green-300" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Kerb</span>
          </div>
          <h2 className="text-white font-bold text-lg">Good morning! 👋</h2>
          <p className="text-white/80 text-sm mt-1">What would you like to do today?</p>
        </div>

        {/* Choices */}
        <div className="p-5 space-y-3">
          <button
            onClick={onStartCell}
            className="w-full flex items-center gap-4 px-4 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <SquareDashedBottom className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">Start Cell</div>
              <div className="text-xs text-primary-foreground/70 mt-0.5">Log in to a cell and begin work</div>
            </div>
          </button>

          <button
            onClick={onViewMap}
            className="w-full flex items-center gap-4 px-4 py-4 bg-muted text-foreground rounded-xl hover:bg-muted/70 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">View Map</div>
              <div className="text-xs text-muted-foreground mt-0.5">Browse the map without checking in</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}