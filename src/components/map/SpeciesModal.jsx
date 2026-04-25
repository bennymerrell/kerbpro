import { useState, useRef, useEffect } from 'react';
import { X, MapPin, Send, Loader2, ImagePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { notifyManagers } from '../../lib/notifyManagers';
import { compressImage } from '../../lib/compressImage';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1d4ed8;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);transform:rotate(-45deg);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function DraggableMarker({ position, onChange }) {
  const markerRef = useRef(null);
  useMapEvents({
    click(e) { onChange({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={PIN_ICON}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const latlng = markerRef.current?.getLatLng();
          if (latlng) onChange({ lat: latlng.lat, lng: latlng.lng });
        },
      }}
    />
  );
}

const CATEGORIES = ['Species', 'Free Parking', 'Hydrant', 'Incident', 'Public Toilet', 'Cafe / Van'];

export default function SpeciesModal({ location, onClose, onSaved }) {
  const [category, setCategory] = useState('Species');
  const [speciesName, setSpeciesName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [statusDetails, setStatusDetails] = useState('');
  const [pinLocation, setPinLocation] = useState({ lat: location.lat, lng: location.lng });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setStatusDetails('');
  }, [category]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    base44.analytics.track({ eventName: 'sighting_submitted', properties: { category } });
    setSending(true);

    let photoUrl = null;
    if (photoFile) {
      const compressed = await compressImage(photoFile);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      photoUrl = file_url;
    }

    const googleMapsLink = `${window.location.origin}/?lat=${pinLocation.lat}&lng=${pinLocation.lng}`;
    const recordedAt = new Date().toLocaleString();

    const statusRow = category === 'Hydrant' && statusDetails
      ? `<tr><td style="height:12px;"></td></tr><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid ${statusDetails === 'working' ? '#16a34a' : '#dc2626'};"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Hydrant Status</p><p style="margin:0;font-size:15px;font-weight:600;color:${statusDetails === 'working' ? '#16a34a' : '#dc2626'};"> ${statusDetails === 'working' ? '✅ Working' : '❌ Not Working'}</p></td></tr>`
      : '';

    await notifyManagers(
      `Spotted: ${category} — ${speciesName}`,
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);"><tr><td style="background:#1d4ed8;padding:28px 32px;"><p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">ℹ️ Sighting Reported</p><p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Recorded on ${recordedAt}</p></td></tr><tr><td style="padding:28px 32px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Category</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${category}</p></td></tr><tr><td style="height:12px;"></td></tr><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Name / Description</p><p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${speciesName}</p></td></tr>${statusRow}${notes ? `<tr><td style="height:12px;"></td></tr><tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #6b7280;"><p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Notes</p><p style="margin:0;font-size:14px;color:#374151;">${notes}</p></td></tr>` : ''}</table><div style="margin:24px 0;border-top:1px solid #e5e7eb;"></div><a href="${googleMapsLink}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">View location on map →</a>${photoUrl ? `<div style="margin-top:24px;"><a href="${photoUrl}" style="display:inline-block;background:#f3f4f6;color:#1d4ed8;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;border:1px solid #e5e7eb;">View photo →</a></div>` : ''}</td></tr><tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;">Generated automatically from the field mapping tool.</p></td></tr></table></td></tr></table></body></html>`
    );

    setSending(false);
    setSent(true);
    onSaved({ lat: pinLocation.lat, lng: pinLocation.lng, species: `[${category}] ${speciesName}`, notes, photoUrl, status_details: statusDetails || null });
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-[4000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border w-full max-w-sm flex flex-col" style={{maxHeight: 'calc(90dvh - env(safe-area-inset-bottom, 0px) - 4rem)'}}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground text-sm">Spotted</h2>
            <p className="text-xs text-muted-foreground">
              {pinLocation.lat.toFixed(5)}, {pinLocation.lng.toFixed(5)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Pin adjuster map */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Pin Location <span className="text-muted-foreground font-normal">(drag or tap to adjust)</span>
            </label>
            <div className="rounded-xl overflow-hidden border border-border" style={{ height: 160 }}>
              <MapContainer
                center={[pinLocation.lat, pinLocation.lng]}
                zoom={18}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                <DraggableMarker position={pinLocation} onChange={setPinLocation} />
              </MapContainer>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              {pinLocation.lat.toFixed(5)}, {pinLocation.lng.toFixed(5)}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">Category <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(cat => (
                <label key={cat} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                  category === cat ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted/50'
                }`}>
                  <input type="radio" name="category" value={cat} checked={category === cat} onChange={() => setCategory(cat)} className="hidden" />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Category-specific fields */}
          {category === 'Hydrant' && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Hydrant Status <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-2 gap-1.5">
                {[{ value: 'working', label: '✅ Working' }, { value: 'not_working', label: '❌ Not Working' }].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                    statusDetails === opt.value
                      ? opt.value === 'working' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border text-foreground hover:bg-muted/50'
                  }`}>
                    <input type="radio" name="hydrantStatus" value={opt.value} checked={statusDetails === opt.value} onChange={() => setStatusDetails(opt.value)} className="hidden" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Name/Description */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
            Name / Description
            </label>
            <input
              type="text"
              value={speciesName}
              onChange={e => setSpeciesName(e.target.value)}
              placeholder="Name or description…"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Tap to add photo</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Density, spread, condition..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
            />
          </div>



          <Button
            type="submit"
            disabled={sending || sent || (category === 'Hydrant' && !statusDetails)}
            className="w-full h-9 text-sm"
          >
            {sent ? (
              '✓ Report Sent!'
            ) : sending ? (
              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Sending...</>
            ) : (
              <><Send className="h-3.5 w-3.5 mr-2" />Send Report</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}