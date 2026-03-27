import { useState } from 'react';
import { X, Leaf, Send, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

export default function SpeciesModal({ location, onClose, onSaved }) {
  const [speciesName, setSpeciesName] = useState('');
  const [notes, setNotes] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!speciesName.trim() || !managerEmail.trim()) return;

    setSending(true);

    const googleMapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

    await base44.integrations.Core.SendEmail({
      to: managerEmail,
      subject: `Invasive Species Sighting: ${speciesName}`,
      body: `
Hello,

An invasive plant species has been recorded during a field survey.

Species: ${speciesName}
${notes ? `Notes: ${notes}\n` : ''}
Location:
  Latitude: ${location.lat.toFixed(6)}
  Longitude: ${location.lng.toFixed(6)}
  Google Maps: ${googleMapsLink}

Recorded on: ${new Date().toLocaleString()}

This report was generated automatically from the field mapping tool.
      `.trim(),
    });

    setSending(false);
    setSent(true);
    onSaved({ lat: location.lat, lng: location.lng, species: speciesName, notes });
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