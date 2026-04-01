import { useState, useRef } from 'react';
import { X, MapPin, Send, Loader2, ImagePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Species', 'Parking', 'Hydrant', 'Map Support', 'Public Toilet', 'Cafe'];

export default function SpeciesModal({ location, onClose, onSaved }) {
  const [category, setCategory] = useState('Species');
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
    const recordedAt = new Date().toLocaleString();

    await base44.integrations.Core.SendEmail({
      to: managerEmail,
      subject: `Spotted: ${category} — ${speciesName}`,
      body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:#1d4ed8;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">ℹ️ Sighting Reported</p>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Recorded on ${recordedAt}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;">
                <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Category</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${category}</p>
              </td>
            </tr>
            <tr><td style="height:12px;"></td></tr>
            <tr>
              <td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;">
                <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Name / Description</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${speciesName}</p>
              </td>
            </tr>
            ${notes ? `<tr><td style="height:12px;"></td></tr>
            <tr>
              <td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #6b7280;">
                <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Notes</p>
                <p style="margin:0;font-size:14px;color:#374151;">${notes}</p>
              </td>
            </tr>` : ''}
          </table>

          <div style="margin:24px 0;border-top:1px solid #e5e7eb;"></div>

          <p style="margin:0 0 12px;font-size:14px;color:#374151;">The sighting was recorded at the following location:</p>
          <a href="${googleMapsLink}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">View location on map →</a>

          ${photoUrl ? `<div style="margin-top:24px;">
            <p style="margin:0 0 10px;font-size:14px;color:#374151;font-weight:600;">Attached photo:</p>
            <a href="${photoUrl}" style="display:inline-block;background:#f3f4f6;color:#1d4ed8;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;border:1px solid #e5e7eb;">View photo →</a>
          </div>` : ''}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">This report was generated automatically from the field mapping tool.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    setSending(false);
    setSent(true);
    onSaved({ lat: location.lat, lng: location.lng, species: `[${category}] ${speciesName}`, notes, photoUrl });
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground text-sm">Spotted</h2>
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
            disabled={sending || sent || !managerEmail.trim()}
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