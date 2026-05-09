import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Pencil, X, Check, Mail, RotateCcw } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  {
    key: 'sighting',
    label: 'Sighting Reported',
    subject_template: 'Spotted: {{category}} — {{name}}',
    intro_text: 'A new sighting has been reported.',
  },
  {
    key: 'cell_started',
    label: 'Cell Started',
    subject_template: 'Cell Started: {{cell_area}} — {{cell_name}}',
    intro_text: 'A worker has started work on a cell.',
  },
  {
    key: 'cell_completed',
    label: 'Cell Completed',
    subject_template: 'Cell Completed: {{cell_area}} — {{cell_name}}',
    intro_text: 'A cell has been marked as completed.',
  },
  {
    key: 'paper_map',
    label: 'Cell Continued',
    subject_template: 'Cell Continued: {{cell_area}} — {{cell_name}}',
    intro_text: 'A worker has continued work on a cell.',
  },
];

function EditTemplateModal({ template, defaults, onClose, onSave }) {
  const [subject, setSubject] = useState(template.subject_template || defaults.subject_template);
  const [intro, setIntro] = useState(template.intro_text || defaults.intro_text);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ subject_template: subject, intro_text: intro });
    setSaving(false);
    onClose();
  }

  function handleReset() {
    setSubject(defaults.subject_template);
    setIntro(defaults.intro_text);
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Edit Template</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{template.label}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Email Intro Text</label>
            <textarea
              value={intro}
              onChange={e => setIntro(e.target.value)}
              rows={3}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Reset to default
          </button>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    base44.entities.EmailTemplate.list().then(data => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  function getTemplate(key) {
    return templates.find(t => t.key === key) || null;
  }

  async function handleSave(key, label, data) {
    const existing = templates.find(t => t.key === key);
    if (existing) {
      const updated = await base44.entities.EmailTemplate.update(existing.id, data);
      setTemplates(prev => prev.map(t => t.id === existing.id ? { ...t, ...data } : t));
    } else {
      const created = await base44.entities.EmailTemplate.create({ key, label, ...data });
      setTemplates(prev => [...prev, created]);
    }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Email Templates</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Customise subject lines and intro text for notification emails.</p>
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
        {DEFAULT_TEMPLATES.map(def => {
          const saved = getTemplate(def.key);
          const isCustomised = !!saved;
          return (
            <div key={def.key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{def.label}</span>
                  {isCustomised && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Custom</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {saved?.subject_template || def.subject_template}
                </div>
              </div>
              <button
                onClick={() => setEditing({ key: def.key, label: def.label, subject_template: saved?.subject_template || def.subject_template, intro_text: saved?.intro_text || def.intro_text })}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-muted/40 rounded-xl px-4 py-3 text-[11px] text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-xs">Available placeholders</p>
        <p><code className="bg-muted px-1 rounded">{'{{category}}'}</code> — sighting category</p>
        <p><code className="bg-muted px-1 rounded">{'{{name}}'}</code> — sighting name / description</p>
        <p><code className="bg-muted px-1 rounded">{'{{cell_name}}'}</code> — cell name</p>
        <p><code className="bg-muted px-1 rounded">{'{{cell_area}}'}</code> — contract / area name</p>
        <p><code className="bg-muted px-1 rounded">{'{{worker}}'}</code> — worker's name</p>
      </div>

      {editing && (
        <EditTemplateModal
          template={editing}
          defaults={DEFAULT_TEMPLATES.find(d => d.key === editing.key)}
          onClose={() => setEditing(null)}
          onSave={(data) => handleSave(editing.key, editing.label, data)}
        />
      )}
    </div>
  );
}