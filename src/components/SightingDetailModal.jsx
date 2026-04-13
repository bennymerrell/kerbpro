import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, MapPin, Calendar, Image, Map, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function SightingDetailModal({ sighting, onClose }) {
  const [fullscreen, setFullscreen] = useState(false);
  const navigate = useNavigate();

  if (!sighting) return null;

  if (fullscreen && sighting.photo_url) {
    return (
      <div className="fixed inset-0 z-[3000] bg-black flex items-center justify-center" onClick={() => setFullscreen(false)}>
        <button className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
          <X className="h-5 w-5" />
        </button>
        <img src={sighting.photo_url} alt={sighting.species} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden"
        style={{ marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {sighting.photo_url ? (
          <div className="relative">
            <img src={sighting.photo_url} alt={sighting.species} className="w-full h-52 object-cover" />
            <button
              onClick={() => setFullscreen(true)}
              className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <Image className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="p-5 space-y-3">
          <h2 className="font-bold text-foreground text-lg">{sighting.species}</h2>
          {sighting.notes && <p className="text-sm text-muted-foreground">{sighting.notes}</p>}
          {sighting.reported_by && (
            <p className="text-xs text-muted-foreground">Reported by: {sighting.reported_by}</p>
          )}
          {sighting.status_details && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              sighting.status_details === 'working' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              <span>{sighting.status_details === 'working' ? '✅' : '❌'}</span>
              <span>{sighting.status_details === 'working' ? 'Working' : 'Not Working'}</span>
            </div>
          )}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{sighting.lat?.toFixed(6)}, {sighting.lng?.toFixed(6)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{sighting.created_date ? format(new Date(sighting.created_date), 'dd MMMM yyyy, HH:mm') : '—'}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                const cat = sighting.species?.match(/^\[(.+?)\]/)?.[1] || 'Species';
                base44.analytics.track({ eventName: 'sighting_detail_view_on_map_clicked', properties: { category: cat } });
                onClose();
                navigate('/', { state: { flyTo: [sighting.lat, sighting.lng], activateCategory: cat } });
              }}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Map className="h-3.5 w-3.5" />
              View on Map
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}