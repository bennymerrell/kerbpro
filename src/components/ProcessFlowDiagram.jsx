import { forwardRef } from 'react';

/* ─── Colour palette ─── */
const C = {
  purple:  { bg: '#f3e8ff', border: '#a855f7', icon: '#7e22ce', text: '#581c87' },
  blue:    { bg: '#dbeafe', border: '#3b82f6', icon: '#1d4ed8', text: '#1e3a8a' },
  indigo:  { bg: '#e0e7ff', border: '#6366f1', icon: '#4338ca', text: '#312e81' },
  emerald: { bg: '#d1fae5', border: '#10b981', icon: '#047857', text: '#064e3b' },
  amber:   { bg: '#fef3c7', border: '#f59e0b', icon: '#b45309', text: '#78350f' },
  orange:  { bg: '#ffedd5', border: '#f97316', icon: '#c2410c', text: '#7c2d12' },
  gray:    { bg: '#f1f5f9', border: '#94a3b8', icon: '#475569', text: '#1e293b' },
  primary: { bg: '#dbeafe', border: '#2563eb', icon: '#1d4ed8', text: '#1e3a8a' },
};

const ROLE_COLORS = {
  admin:   { bg: '#ede9fe', text: '#5b21b6', border: '#a78bfa' },
  manager: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  user:    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
};

function RolePill({ role }) {
  const labels = { admin: 'Admin', manager: 'Manager', user: 'Field User' };
  const s = ROLE_COLORS[role];
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 999, fontSize: 9, fontWeight: 700, padding: '1px 7px',
      display: 'inline-block', lineHeight: '16px', marginRight: 3,
    }}>
      {labels[role]}
    </span>
  );
}

function Step({ title, description, roles = [], color = C.gray, icon }) {
  return (
    <div style={{
      background: color.bg,
      border: `1.5px solid ${color.border}`,
      borderRadius: 12,
      padding: '10px 14px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      marginBottom: 0,
    }}>
      {icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color.border, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0, fontSize: 15,
        }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: 12, color: color.text, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.5 }}>{description}</div>
        {roles.length > 0 && (
          <div style={{ marginTop: 5 }}>
            {roles.map(r => <RolePill key={r} role={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Arrow({ label } = {}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0' }}>
      <div style={{ width: 2, height: 12, background: '#cbd5e1' }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '8px solid #cbd5e1',
      }} />
      {label && <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{label}</div>}
    </div>
  );
}

function SectionHeader({ num, title, subtitle, color = C.gray }) {
  return (
    <div style={{
      background: color.border,
      borderRadius: '10px 10px 0 0',
      padding: '10px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#fff',
        }}>{num}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function Section({ num, title, subtitle, color, children }) {
  return (
    <div style={{
      border: `2px solid ${color.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    }}>
      <SectionHeader num={num} title={title} subtitle={subtitle} color={color} />
      <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function TwoCol({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {children}
    </div>
  );
}

const ProcessFlowDiagram = forwardRef(function ProcessFlowDiagram(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 720,
        background: '#f8fafc',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: '28px 32px 40px',
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>🌿 KerbPro — System Process Flow</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>End-to-end functionality overview · Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      {/* Legend */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '8px 16px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Role Legend</div>
        {['admin', 'manager', 'user'].map(r => <RolePill key={r} role={r} />)}
      </div>

      {/* Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* 1. Onboarding */}
        <Section num="1" title="Onboarding & Setup" subtitle="Admin configures the system before field work begins" color={C.purple}>
          <Step icon="🏢" title="Create Offices" description="Admin creates office locations. Each office groups cells and users into an operational area." roles={['admin']} color={C.purple} />
          <Arrow label="then" />
          <Step icon="👥" title="Invite Users & Assign Roles" description="Admin invites field workers (role: user) and managers. Users are assigned to an office and a manager contact." roles={['admin']} color={C.purple} />
          <Arrow label="then" />
          <Step icon="📱" title="Field User Saves Phone Number" description="On first login, field users are prompted to save their mobile number — used for SMS/WhatsApp manager notifications." roles={['user']} color={C.emerald} />
        </Section>

        <Arrow />

        {/* 2. Cell Creation */}
        <Section num="2" title="Cell Creation" subtitle="Admin draws geographic work cells on the map" color={C.indigo}>
          <Step icon="🔷" title="Draw a Cell" description="Open Map → Draw Cell mode. Tap to place polygon points, close the shape, then name and save it. Cells are assigned to an office and area." roles={['admin', 'manager']} color={C.indigo} />
          <Arrow label="optional" />
          <TwoCol>
            <Step icon="📐" title="Recalculate Road Mileage" description="Queries OpenStreetMap to calculate adopted/unadopted road metres. Road types can be toggled." roles={['admin', 'manager']} color={C.indigo} />
            <Step icon="👁" title="Show / Hide Cells" description="Individual cells can be toggled visible or hidden on the map without deleting them." roles={['admin', 'manager']} color={C.indigo} />
          </TwoCol>
          <Arrow label="admin can also" />
          <TwoCol>
            <Step icon="✏️" title="Edit Cell Geometry" description="Drag polygon vertices to reshape any existing cell boundary." roles={['admin', 'manager']} color={C.indigo} />
            <Step icon="🖨" title="Print / Export Map" description="Generate a PDF snapshot of the map with selected cell details." roles={['admin', 'manager']} color={C.indigo} />
          </TwoCol>
        </Section>

        <Arrow />

        {/* 3. Daily Field Workflow */}
        <Section num="3" title="Daily Field Workflow" subtitle="What field users do each working day" color={C.emerald}>
          <Step icon="🌅" title="Morning Landing Screen" description="After 3am GMT, field users see a choice: 'Start Cell' (check in) or 'View Map' (browse without checking in). Shown once per day with a 1-hour dismissal grace period." roles={['user']} color={C.emerald} />
          <Arrow label="if Start Cell" />
          <Step icon="🔐" title="Check In to a Cell" description="User selects their office area and specific cell from dropdowns (completed cells excluded). Taps 'Start Work' — cell turns orange on the map. Users can also tap any orange/blue cell polygon directly to check in." roles={['user']} color={C.emerald} />
          <Arrow />
          <Step icon="🔔" title="Manager Notified via SMS / WhatsApp" description="The assigned manager automatically receives an SMS/WhatsApp notification with user name, cell name, and area — sent via Twilio." roles={['manager']} color={C.blue} />
          <Arrow label="during the day" />
          <Step icon="🍃" title="Log Sightings" description="Tap 'Spotted' from the map menu. GPS location is captured automatically and can be fine-tuned on a mini map. Choose a category (Species, Hydrant, Incident, Free Parking, Public Toilet, Cafe/Van), add a name, notes, and optional photo. Report is emailed to managers." roles={['user', 'admin', 'manager']} color={C.emerald} />
          <Arrow label="end of day" />
          <TwoCol>
            <Step icon="✅" title="Finish Cell" description="Marks the cell as Completed (green). All users on that cell are automatically logged off. Manager is notified via SMS." roles={['user']} color={C.emerald} />
            <Step icon="🚪" title="Log Off (Keep In Progress)" description="User logs off without completing. Cell stays orange (In Progress) so another user can continue later." roles={['user']} color={C.orange} />
          </TwoCol>
        </Section>

        <Arrow />

        {/* 4. Sightings */}
        <Section num="4" title="Sightings Management" subtitle="Viewing, filtering and managing recorded sightings" color={C.amber}>
          <TwoCol>
            <Step icon="🔍" title="Browse & Search" description="Filter by category, text search, and sort by date or species. Photo thumbnails and category icons shown." roles={['admin', 'manager', 'user']} color={C.amber} />
            <Step icon="🗺" title="View on Map" description="'View on Map' button flies the map to that sighting's location and activates the correct category filter." roles={['admin', 'manager', 'user']} color={C.amber} />
          </TwoCol>
          <Arrow />
          <TwoCol>
            <Step icon="✥" title="Move Sighting Marker" description="Tap a map marker → 'Move Icon' to drag it to a corrected position. Persisted to the database." roles={['admin', 'manager', 'user']} color={C.amber} />
            <Step icon="📷" title="Update Photo / Details" description="View full details modal, replace or add a photo, see reported-by, coordinates, and timestamp." roles={['admin', 'manager', 'user']} color={C.amber} />
          </TwoCol>
        </Section>

        <Arrow />

        {/* 5. Dashboard */}
        <Section num="5" title="Admin Dashboard" subtitle="Analytics, user management and system oversight" color={C.primary}>
          <TwoCol>
            <Step icon="📊" title="Analytics" description="Cell completion rates, sightings by category, activity over time, and field coverage stats." roles={['admin', 'manager']} color={C.primary} />
            <Step icon="👥" title="User Management" description="Invite users, change roles, assign offices and managers, view all accounts." roles={['admin']} color={C.primary} />
          </TwoCol>
          <TwoCol>
            <Step icon="🏢" title="Office Management" description="Create, rename and delete offices that group cells and users." roles={['admin', 'manager']} color={C.primary} />
            <Step icon="🔷" title="Cells Dashboard" description="View road mileage totals, completion status, and a log of when each cell was completed and by whom." roles={['admin', 'manager']} color={C.primary} />
          </TwoCol>
          <Step icon="🍃" title="Sightings Dashboard" description="Table of all sightings with admin controls to edit records, delete entries, and view full details." roles={['admin', 'manager']} color={C.primary} />
        </Section>

        <Arrow />

        {/* 6. Additional Tools */}
        <Section num="6" title="Additional Tools" subtitle="Supporting features available across the app" color={C.gray}>
          <TwoCol>
            <Step icon="🧪" title="Chemical Logs" description="Weekly chemical usage records — track chemical names, units, start/end amounts, and notes for compliance." roles={['admin', 'manager', 'user']} color={C.gray} />
            <Step icon="📍" title="Route Planning" description="Plot waypoints on the map to calculate total route distance — useful for planning spray runs." roles={['admin', 'manager', 'user']} color={C.gray} />
          </TwoCol>
          <TwoCol>
            <Step icon="🔌" title="Offline Mode" description="Cells cached locally. Sightings queued offline and auto-synced when connectivity is restored." roles={['user']} color={C.gray} />
            <Step icon="🔎" title="Address Search" description="Search any address from the top bar and fly the map to that location instantly." roles={['admin', 'manager', 'user']} color={C.gray} />
          </TwoCol>
        </Section>

      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 28, fontSize: 10, color: '#94a3b8' }}>
        KerbPro Field Management System · Confidential
      </div>
    </div>
  );
});

export default ProcessFlowDiagram;