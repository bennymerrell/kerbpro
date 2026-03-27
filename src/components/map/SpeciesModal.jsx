import { useState, useRef } from 'react';
import { X, Leaf, Send, Loader2, ImagePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

export default function SpeciesModal({ location, onClose, onSaved }) {
  const [speciesName, setSpeciesName] = useState('');
  const [notes, setNotes] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef(null);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!speciesName.trim() || !managerEmail.trim()) return;
    setSending(true);

    let photoUrl = null;
    if (photoFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      photoUrl = file_url;
    }

    const googleMapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

    await base44.integrations.Core.SendEmail({
      to: managerEmail,
      subject: `Invasive Species Sighting: ${speciesName}`,
      body: `Hello,\n\nAn invasive plant species has been recorded during a field survey.\n\nSpecies: ${speciesName}\n${notes ? `Notes: ${notes}\n` : ''}\nLocation:\n  Latitude: ${location.lat.toFixed(6)}\n  Longitude: ${location.lng.toFixed(6)}\n  Google Maps: ${googleMapsLink}\n${photoUrl ? `\nPhoto: ${photoUrl}\n` : ''}\nRecorded on: ${new Date().toLocaleString()}\n\nThis report was generated automatically from the field mapping tool.`,
    });

    setSending(false);
    setSent(true);
    onSaved({ lat: location.lat, lng: location.lng, species: speciesName, notes, photoUrl });
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground text-sm">Record Invasive Species</h2>
            <p className="text-xs text-muted-foreground">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Species Name */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Species Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={speciesName}
              onChange={e => setSpeciesName(e.target.value)}
              placeholder="e.g. Japanese Knotweed"
              required
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

          {/* Manager Email */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Manager Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={managerEmail}
              onChange={e => setManagerEmail(e.target.value)}
              placeholder="manager@example.com"
              required
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={sending || sent || !speciesName.trim() || !managerEmail.trim()}
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