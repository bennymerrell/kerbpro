import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ChevronLeft, CheckCircle2, Clock, ClipboardList, Loader2 } from 'lucide-react';

// ─── Question definitions ────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'intro',
    title: 'About You',
    description: 'A few quick details so we can understand your role.',
    questions: [
      { id: 'name', type: 'text', label: 'Your name', placeholder: 'e.g. John Smith', required: true },
      {
        id: 'role', type: 'select', label: 'Your role', required: true,
        options: ['Field Worker', 'Team Leader / Supervisor', 'Office Manager', 'Admin / Director', 'Other'],
      },
      {
        id: 'experience', type: 'select', label: 'How long have you worked here?', required: true,
        options: ['Less than 6 months', '6 months – 1 year', '1 – 3 years', '3+ years'],
      },
    ],
  },
  {
    id: 'cell_checkin',
    title: 'Cell Check-In & Log-Out',
    description: 'These questions are about logging into a cell to start work, and logging off at the end of the day.',
    icon: '📍',
    questions: [
      {
        id: 'checkin_before_method', type: 'select',
        label: 'Before KerbPro, how did you record which cell you were working in?',
        options: ['Paper form / logbook', 'Text / WhatsApp message to manager', 'Phone call', 'Nothing — it wasn\'t tracked', 'Other'],
        other: true,
      },
      {
        id: 'checkin_before_time', type: 'duration',
        label: 'How long did the old check-in / check-out process take you each day?',
        hint: 'Include time to fill in the form, send messages, wait for confirmation, etc.',
      },
      {
        id: 'checkin_app_time', type: 'duration',
        label: 'How long does the KerbPro check-in / check-out take you each day?',
      },
      {
        id: 'checkin_confidence', type: 'scale',
        label: 'How confident are you now that your manager always knows which cell you\'re in?',
        low: 'Not confident', high: 'Very confident',
      },
      {
        id: 'checkin_comment', type: 'textarea',
        label: 'Any other comments about the check-in process?', placeholder: 'Optional…',
      },
    ],
  },
  {
    id: 'sightings',
    title: 'Logging Sightings & Incidents',
    description: 'These questions cover how you record things you spot in the field — species, hydrants, incidents, parking spots, etc.',
    icon: '👁️',
    questions: [
      {
        id: 'sightings_before_method', type: 'select',
        label: 'Before KerbPro, how did you record things you spotted in the field?',
        options: ['Paper notepad / form', 'Photo on personal phone with notes', 'Text / WhatsApp to manager', 'Verbal report at end of day', 'It wasn\'t recorded', 'Other'],
        other: true,
      },
      {
        id: 'sightings_before_time', type: 'duration',
        label: 'How long did it take to log a single sighting using the old method?',
        hint: 'Include time to note it down, take photo, send it, etc.',
      },
      {
        id: 'sightings_app_time', type: 'duration',
        label: 'How long does it take to log a sighting using KerbPro?',
      },
      {
        id: 'sightings_accuracy', type: 'scale',
        label: 'How accurate do you think the sighting location records are now compared to before?',
        low: 'Much less accurate', high: 'Much more accurate',
      },
      {
        id: 'sightings_frequency', type: 'select',
        label: 'How often do you log sightings?',
        options: ['Multiple times per day', 'Once a day', 'A few times a week', 'Rarely'],
      },
      {
        id: 'sightings_comment', type: 'textarea',
        label: 'Any other comments about logging sightings?', placeholder: 'Optional…',
      },
    ],
  },
  {
    id: 'chemical_logs',
    title: 'Chemical Usage Logs',
    description: 'These questions are about recording weekly chemical start and end amounts.',
    icon: '🧪',
    questions: [
      {
        id: 'chems_before_method', type: 'select',
        label: 'Before KerbPro, how were chemical usage records kept?',
        options: ['Paper log book', 'Spreadsheet (Excel / Google Sheets)', 'Verbal report to manager', 'It wasn\'t recorded', 'Other'],
        other: true,
      },
      {
        id: 'chems_before_time', type: 'duration',
        label: 'How long did completing / submitting a weekly chemical log take (old method)?',
      },
      {
        id: 'chems_app_time', type: 'duration',
        label: 'How long does it take to complete a chemical log on KerbPro?',
      },
      {
        id: 'chems_errors', type: 'scale',
        label: 'How often were errors or missing data a problem with the old method?',
        low: 'Never / rarely', high: 'Very often',
      },
      {
        id: 'chems_comment', type: 'textarea',
        label: 'Any other comments about chemical logging?', placeholder: 'Optional…',
      },
    ],
  },
  {
    id: 'map',
    title: 'Map & Cell Viewing',
    description: 'These questions relate to using the map to see cells, sightings and plan your route.',
    icon: '🗺️',
    questions: [
      {
        id: 'map_before_method', type: 'select',
        label: 'Before KerbPro, how did you know which roads were in your cell / area?',
        options: ['Printed paper map', 'Manager briefed you verbally', 'Relied on memory / experience', 'Street-level GPS app (Google Maps, etc.)', 'Other'],
        other: true,
      },
      {
        id: 'map_print_time', type: 'duration',
        label: 'How much time did preparing or printing maps for the day take (old method)?',
        hint: 'Include printing, cutting, packing maps, etc.',
      },
      {
        id: 'map_navigation_time', type: 'duration',
        label: 'How much time do you save per day by having your cell visible on the app instead of a paper map?',
        hint: 'Estimate time saved on navigation, finding roads, etc.',
      },
      {
        id: 'map_confidence', type: 'scale',
        label: 'How confident are you that you cover every road in your cell now vs before KerbPro?',
        low: 'Less confident', high: 'Much more confident',
      },
      {
        id: 'map_comment', type: 'textarea',
        label: 'Any other comments about the map / cell view?', placeholder: 'Optional…',
      },
    ],
  },
  {
    id: 'manager_comms',
    title: 'Communication with Managers',
    description: 'These questions cover how information flows between field staff and office/managers.',
    icon: '📲',
    questions: [
      {
        id: 'comms_before_frequency', type: 'select',
        label: 'Before KerbPro, how often did you need to contact your manager to report updates?',
        options: ['Multiple times per day', 'Once a day', 'A few times a week', 'Rarely'],
      },
      {
        id: 'comms_before_time', type: 'duration',
        label: 'How much time per day did you spend on calls/messages reporting progress or incidents?',
      },
      {
        id: 'comms_app_time', type: 'duration',
        label: 'How much time per day do you now spend on that type of reporting?',
        hint: 'Since using KerbPro — the app sends notifications automatically.',
      },
      {
        id: 'comms_satisfaction', type: 'scale',
        label: 'How satisfied are you with how quickly managers are informed of issues now?',
        low: 'Very dissatisfied', high: 'Very satisfied',
      },
      {
        id: 'comms_comment', type: 'textarea',
        label: 'Any other comments about communication?', placeholder: 'Optional…',
      },
    ],
  },
  {
    id: 'overall',
    title: 'Overall Impact',
    description: 'Final questions about the overall effect KerbPro has had on your working day.',
    icon: '⭐',
    questions: [
      {
        id: 'overall_time_saved', type: 'duration',
        label: 'Roughly how much time do you think KerbPro saves you each working day in total?',
        hint: 'Add up everything — check-ins, logging, maps, communications, paperwork, etc.',
      },
      {
        id: 'overall_stress', type: 'scale',
        label: 'How much has KerbPro reduced the stress / admin burden of your day?',
        low: 'No change', high: 'Significantly reduced',
      },
      {
        id: 'overall_paper', type: 'scale',
        label: 'How much has KerbPro reduced the amount of paperwork you handle?',
        low: 'No change', high: 'Completely eliminated',
      },
      {
        id: 'overall_rating', type: 'scale',
        label: 'Overall, how would you rate KerbPro as a tool for your daily work?',
        low: '1 — Not helpful', high: '10 — Extremely helpful',
        max: 10,
      },
      {
        id: 'overall_feature_request', type: 'textarea',
        label: 'Is there anything KerbPro doesn\'t do yet that would save you even more time?',
        placeholder: 'Your suggestions…',
      },
      {
        id: 'overall_comment', type: 'textarea',
        label: 'Any other comments or feedback?',
        placeholder: 'Optional…',
      },
    ],
  },
];

// ─── Duration picker ──────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { label: 'None / not applicable', value: '0' },
  { label: 'Under 1 minute', value: '<1min' },
  { label: '1 – 2 minutes', value: '1-2min' },
  { label: '2 – 5 minutes', value: '2-5min' },
  { label: '5 – 10 minutes', value: '5-10min' },
  { label: '10 – 20 minutes', value: '10-20min' },
  { label: '20 – 30 minutes', value: '20-30min' },
  { label: '30 – 60 minutes', value: '30-60min' },
  { label: 'More than 1 hour', value: '>1hr' },
];

function DurationPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {DURATION_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:border-primary/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Scale picker ─────────────────────────────────────────────────────────────
function ScalePicker({ value, onChange, low, high, max = 5 }) {
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="mt-2">
      <div className="flex gap-1.5 flex-wrap">
        {nums.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
              value === String(n)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:border-primary/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

// ─── Single question ──────────────────────────────────────────────────────────
function Question({ q, value, onChange }) {
  const [otherText, setOtherText] = useState('');

  function handleSelect(v) {
    if (v === 'Other' && q.other) {
      onChange('Other: ');
    } else {
      onChange(v);
    }
  }

  const isOtherSelected = q.other && typeof value === 'string' && value.startsWith('Other:');

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{q.label}</label>
      {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}

      {q.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={q.placeholder}
          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}

      {q.type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={q.placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      )}

      {q.type === 'select' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {q.options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  (value === opt || (opt === 'Other' && isOtherSelected))
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {isOtherSelected && (
            <input
              type="text"
              value={value.replace('Other: ', '')}
              onChange={e => onChange('Other: ' + e.target.value)}
              placeholder="Please specify…"
              className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>
      )}

      {q.type === 'duration' && (
        <DurationPicker value={value || ''} onChange={onChange} />
      )}

      {q.type === 'scale' && (
        <ScalePicker value={value || ''} onChange={onChange} low={q.low} high={q.high} max={q.max} />
      )}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  const pct = Math.round(((step) / total) * 100);
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 bg-primary rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TimeSavingsQuestionnaire() {
  const [step, setStep] = useState(0); // 0 = intro, 1..n = sections, n+1 = thank you
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = SECTIONS.length;
  const currentSection = SECTIONS[step];
  const isLast = step === SECTIONS.length - 1;

  function setAnswer(qId, val) {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  }

  function canAdvance() {
    if (!currentSection) return false;
    return currentSection.questions
      .filter(q => q.required)
      .every(q => answers[q.id] && answers[q.id].toString().trim() !== '');
  }

  async function handleSubmit() {
    setSubmitting(true);
    // Build a readable summary email
    const name = answers['name'] || 'Anonymous';
    const role = answers['role'] || 'Unknown role';

    const rows = SECTIONS.flatMap(s =>
      s.questions
        .filter(q => answers[q.id])
        .map(q => `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;width:45%">${s.title} — ${q.label}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:500">${answers[q.id]}</td></tr>`)
    ).join('');

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#1a6b3c;padding:24px 28px;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">📋 Time Savings Questionnaire</p>
          <p style="margin:6px 0 0;color:#a7f3c0;font-size:13px;">Submitted by ${name} (${role}) on ${new Date().toLocaleDateString('en-GB', { day:'numeric',month:'short',year:'numeric' })}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">Sent automatically from the KerbPro Time Savings Survey.</p>
        </div>
      </div>
    </body></html>`;

    try {
      await base44.integrations.Core.SendEmail({
        to: 'admin@kerbpro.app',
        subject: `KerbPro Time Savings Survey — ${name}`,
        body: html,
      });
    } catch {}

    setSubmitting(false);
    setSubmitted(true);
  }

  // Thank you screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Thank you!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your responses have been submitted and will help us understand the real-world time savings KerbPro delivers. We really appreciate your honesty.
          </p>
          <button
            onClick={() => window.history.back()}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 overflow-y-auto" style={{ height: '100dvh', overflowY: 'auto' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">KerbPro Time Savings Survey</span>
            </div>
            <span className="text-xs text-muted-foreground">{step + 1} / {totalSteps}</span>
          </div>
          <ProgressBar step={step + 1} total={totalSteps} />
        </div>
      </div>

      {/* Section */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Section header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            {currentSection.icon && <span className="text-xl">{currentSection.icon}</span>}
            <h2 className="text-xl font-bold text-foreground">{currentSection.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{currentSection.description}</p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentSection.questions.map(q => (
            <div key={q.id} className="bg-card border border-border rounded-2xl p-4">
              <Question q={q} value={answers[q.id] || ''} onChange={val => setAnswer(q.id, val)} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4 z-20">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 h-11 px-4 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? 'Submitting…' : 'Submit Survey'}
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}