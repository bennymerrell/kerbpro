import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Building2, SquareDashedBottom, LogIn, Leaf, MapPin, Phone, ArrowLeft, Camera, X, Upload } from 'lucide-react';
import { compressImage } from '../../lib/compressImage';
import { notifyManagers } from '../../lib/notifyManagers';

export default function CellCheckInModal({ currentUser, preselectedCell, onCheckIn, onPhoneSaved, onDismiss, activeCell, mode }) {
  const [office, setOffice] = useState(null);
  const [cells, setCells] = useState([]);
  const [selectedArea, setSelectedArea] = useState(preselectedCell?.area || '');
  const [selectedCellId, setSelectedCellId] = useState(preselectedCell?.id || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneConfirmed, setPhoneConfirmed] = useState(!!currentUser?.phone);

  // Resume / photo state
  const isResumeMode = mode === 'resume' && !!activeCell;
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleResumeContinue() {
    setUploading(true);
    let photoUrl = null;
    if (photoFile) {
      const compressed = await compressImage(photoFile);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      photoUrl = file_url;

      // Notify managers with the photo
      const cellName = activeCell.name || 'Unnamed Cell';
      const cellArea = activeCell.area || '';
      const recordedAt = new Date().toLocaleString();
      await notifyManagers(
        `Paper Map Uploaded: ${cellArea} — ${cellName}`,
        `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1d4ed8;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">📸 Paper Map Photo Uploaded</p>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Uploaded on ${recordedAt}</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;">
              <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Cell</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${cellArea ? cellArea + ' — ' : ''}${cellName}</p>
            </td></tr>
            <tr><td style="height:12px;"></td></tr>
            <tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:4px solid #1d4ed8;">
              <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;">Worker</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${currentUser?.full_name || currentUser?.email || 'Unknown'}</p>
            </td></tr>
          </table>
          <div style="margin:24px 0;border-top:1px solid #e5e7eb;"></div>
          <a href="${photoUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">View Photo →</a>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Sent automatically from the KerbPro field mapping tool.</p>
        </td></tr></table></td></tr></table></body></html>`
      );
    }
    setUploading(false);
    onCheckIn(activeCell);
  }

  useEffect(() => {
    const officeId = currentUser?.office_id;

    Promise.all([
      officeId ? base44.entities.Office.list() : Promise.resolve([]),
      base44.entities.Cell.list('-created_date', 200),
    ]).then(([offices, allCells]) => {
      const userOffice = offices.find(o => o.id === officeId) || null;
      setOffice(userOffice);

      // Exclude completed cells — they are locked and cannot be booked onto
      const relevantCells = (officeId
        ? allCells.filter(c => c.office_id === officeId)
        : allCells
      ).filter(c => c.work_status !== 'completed');
      setCells(relevantCells);
      setLoading(false);
    });
  }, [currentUser]);

  const areas = [...new Set(cells.map(c => c.area).filter(Boolean))].sort();
  const filteredCells = selectedArea ? cells.filter(c => c.area === selectedArea) : cells;

  // Start work on a new cell
  async function handleStartNew() {
    if (!selectedCellId) return;
    setSubmitting(true);
    const cell = cells.find(c => c.id === selectedCellId);
    if (!cell) return;

    const prevStatus = cell.work_status || 'not_started';
    const today = new Date().toISOString().split('T')[0];

    await base44.entities.Cell.update(cell.id, { work_status: 'in_progress' });
    await base44.auth.updateMe({
      active_cell_id: cell.id,
      active_cell_prev_status: prevStatus,
      active_cell_checkin_date: today,
    });

    // Notify assigned manager
    const me = await base44.auth.me();
    if (me?.manager_id) {
      base44.functions.invoke('notifyCellAction', {
        action: 'started',
        cellName: cell.name || 'Unnamed Cell',
        cellArea: cell.area || '',
        managerId: me.manager_id,
      }).catch(() => {});
    }

    setSubmitting(false);
    onCheckIn({ ...cell, work_status: 'in_progress' });
  }

  async function handleSavePhone() {
    const cleaned = phoneInput.trim();
    if (!cleaned) return;
    setSavingPhone(true);
    await base44.auth.updateMe({ phone: cleaned });
    setSavingPhone(false);
    setPhoneConfirmed(true);
    onPhoneSaved?.({ ...currentUser, phone: cleaned });
  }

  // Resume mode — show photo upload + continue screen
  if (isResumeMode) {
    return (
      <div className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
          <div className="bg-orange-500 px-5 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <SquareDashedBottom className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-black text-2xl tracking-tight">KerbPro</span>
            </div>
            <h2 className="text-white font-bold text-lg">Welcome back! 👷</h2>
            <p className="text-white/80 text-sm mt-1">
              Continuing <span className="font-semibold">{activeCell?.area ? `${activeCell.area} — ` : ''}{activeCell?.name || 'your cell'}</span>
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Photo upload */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Camera className="h-3.5 w-3.5" /> Paper Map Photo <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={photoPreview} alt="Paper map" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-orange-400 hover:bg-orange-50/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs font-medium">Take photo of paper map</span>
                  <span className="text-[10px]">Photo sent to managers automatically</span>
                </button>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleResumeContinue}
              disabled={uploading}
              className="w-full h-11 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 className="h-4 w-4 animate-spin" />{photoFile ? 'Uploading & Starting…' : 'Starting…'}</>
                : <><Upload className="h-4 w-4" />{photoFile ? 'Upload Photo & Start Work' : 'Start Work'}</>
              }
            </button>

            <button
              onClick={onDismiss}
              className="w-full h-10 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/70 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show phone capture screen if no phone on record
  if (!phoneConfirmed) {
    return (
      <div className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
          <div className="bg-primary px-5 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-green-300" />
              </div>
              <span className="text-white font-black text-2xl tracking-tight">KerbPro</span>
            </div>
            <h2 className="text-white font-bold text-lg">One quick thing 📱</h2>
            <p className="text-white/80 text-sm mt-1">We need your mobile number to notify your manager</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
              <Phone className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
              Your manager will be notified by SMS/WhatsApp when you check in and check out of cells.
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Phone className="h-3.5 w-3.5" /> Mobile Number
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="+44 7700 900000"
                className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleSavePhone}
              disabled={!phoneInput.trim() || savingPhone}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-5 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-green-300" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">KerbPro</span>
            </div>
            <h2 className="text-white font-bold text-lg">Good morning! 👋</h2>
          <p className="text-white/80 text-sm mt-1">Please log into your cell to begin work</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Office — read-only */}
            {office && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Your Office</div>
                  <div className="text-sm font-semibold text-foreground">{office.name}</div>
                </div>
              </div>
            )}

            {areas.length > 0 && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5" /> Cell Area
                </label>
                <select
                  value={selectedArea}
                  onChange={e => { setSelectedArea(e.target.value); setSelectedCellId(''); }}
                  className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Select an area —</option>
                  {areas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <SquareDashedBottom className="h-3.5 w-3.5" /> Cell Number
              </label>
              <select
                value={selectedCellId}
                onChange={e => setSelectedCellId(e.target.value)}
                disabled={!selectedArea}
                className="w-full text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{selectedArea ? '— Select a cell —' : '— Select an area first —'}</option>
                {filteredCells.map(c => (
                  <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartNew}
              disabled={!selectedCellId || submitting}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Start Work
            </button>

            {preselectedCell && onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full h-10 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/70 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Map
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}