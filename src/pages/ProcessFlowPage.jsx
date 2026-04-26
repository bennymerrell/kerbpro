import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDown, ArrowRight, Users, Map, SquareDashedBottom, Leaf, LogIn, CheckCircle2, LogOut, Shapes, Eye, RefreshCw, BarChart2, FlaskConical, Building2, Phone, Bell, Trash2, Pencil, Search } from 'lucide-react';

const ROLES = {
  admin:   { label: 'Admin',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  user:    { label: 'Field User', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

function RoleBadge({ role }) {
  const r = ROLES[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${r.color}`}>
      {r.label}
    </span>
  );
}

function FlowCard({ icon: Icon, title, description, roles = [], color = 'bg-white', iconBg = 'bg-primary/10', iconColor = 'text-primary' }) {
  return (
    <div className={`${color} rounded-2xl border border-border shadow-sm p-4 flex gap-3 items-start`}>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground mb-0.5">{title}</div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {roles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {roles.map(r => <RoleBadge key={r} role={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children, accent = 'border-primary' }) {
  return (
    <div className={`rounded-2xl border-2 ${accent} bg-card shadow-sm overflow-hidden`}>
      <div className={`px-4 py-3 border-b border-border`}>
        <div className="font-bold text-sm text-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function Arrow({ label } = {}) {
  return (
    <div className="flex flex-col items-center py-1 gap-0.5">
      <ArrowDown className="h-5 w-5 text-muted-foreground/60" />
      {label && <span className="text-[10px] text-muted-foreground font-medium">{label}</span>}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border" />
      {label && <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{label}</span>}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function ProcessFlowPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-sm text-foreground">KerbPro — Process Flow</h1>
          <p className="text-[11px] text-muted-foreground">Full system functionality overview</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Role legend */}
        <div className="bg-muted/40 rounded-2xl px-4 py-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">User Roles</div>
          <div className="flex flex-wrap gap-2">
            <RoleBadge role="admin" />
            <span className="text-xs text-muted-foreground">— Full system access, cell management, dashboards</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <RoleBadge role="manager" />
            <span className="text-xs text-muted-foreground">— Receives SMS/WhatsApp notifications, draws cells, views dashboard</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <RoleBadge role="user" />
            <span className="text-xs text-muted-foreground">— Field workers who check into cells and log sightings</span>
          </div>
        </div>

        {/* ── 1. ONBOARDING ── */}
        <Section title="1 · Onboarding & Setup" subtitle="Admin configures the system before field work begins" accent="border-purple-400">
          <FlowCard
            icon={Building2}
            title="Create Offices"
            description="Admin creates one or more office locations. Each office groups cells and users into an operational area."
            roles={['admin']}
            iconBg="bg-purple-100" iconColor="text-purple-600"
          />
          <Arrow label="then" />
          <FlowCard
            icon={Users}
            title="Invite Users & Assign Roles"
            description="Admin invites field workers (role: user) and managers. Users are assigned to an office and a manager contact."
            roles={['admin']}
            iconBg="bg-purple-100" iconColor="text-purple-600"
          />
          <Arrow label="then" />
          <FlowCard
            icon={Phone}
            title="Field User Saves Phone Number"
            description="On first login, field users are prompted to save their mobile number — used for SMS/WhatsApp manager notifications."
            roles={['user']}
            iconBg="bg-emerald-100" iconColor="text-emerald-600"
          />
        </Section>

        <Arrow />

        {/* ── 2. CELL CREATION ── */}
        <Section title="2 · Cell Creation" subtitle="Admin draws geographic work cells on the map" accent="border-indigo-400">
          <FlowCard
            icon={Shapes}
            title="Draw a Cell"
            description="Admin opens the map menu → Draw Cell mode. Tap to place polygon points, close the shape, then name and save it. Cells are assigned to an office and area."
            roles={['admin', 'manager']}
            iconBg="bg-indigo-100" iconColor="text-indigo-600"
          />
          <Arrow label="optional" />
          <FlowCard
            icon={RefreshCw}
            title="Recalculate Road Mileage"
            description="Admin triggers 'Recalc Miles' on any cell. The system queries OpenStreetMap to calculate adopted/unadopted road metres within the polygon. Road types can be toggled to include/exclude from spray totals."
            roles={['admin', 'manager']}
            iconBg="bg-indigo-100" iconColor="text-indigo-600"
          />
          <Arrow label="optional" />
          <FlowCard
            icon={Eye}
            title="Show / Hide Cells on Map"
            description="Individual cells can be toggled visible or hidden. Hidden cells still exist in the database but won't appear on the map."
            roles={['admin', 'manager']}
            iconBg="bg-indigo-100" iconColor="text-indigo-600"
          />
        </Section>

        <Arrow />

        {/* ── 3. DAILY FIELD WORKFLOW ── */}
        <Section title="3 · Daily Field Workflow" subtitle="What field users do each working day" accent="border-emerald-400">
          <FlowCard
            icon={LogIn}
            title="Morning: Check In to a Cell"
            description="On opening the app (after 3am GMT), field users see a landing screen. They select their office area and specific cell, then tap 'Start Work'. The cell turns orange on the map."
            roles={['user']}
            iconBg="bg-emerald-100" iconColor="text-emerald-600"
          />
          <Arrow label="whilst working" />
          <FlowCard
            icon={Bell}
            title="Manager Notified via SMS / WhatsApp"
            description="When a user checks in, their assigned manager automatically receives an SMS/WhatsApp notification with the user name, cell name, and area."
            roles={['manager']}
            iconBg="bg-blue-100" iconColor="text-blue-600"
          />
          <Arrow label="during the day" />
          <FlowCard
            icon={Leaf}
            title="Log Sightings"
            description="Field users tap 'Spotted' from the map menu to record a sighting at their current GPS location. They choose a category (Species, Hydrant, Incident, Free Parking, Public Toilet, Cafe/Van), add notes and a photo, and submit. Sightings appear as map markers."
            roles={['user', 'admin', 'manager']}
            iconBg="bg-emerald-100" iconColor="text-emerald-600"
          />
          <Arrow label="end of day" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FlowCard
              icon={CheckCircle2}
              title="Finish Cell"
              description="Marks the cell as Completed (green on map). All users on that cell are automatically logged off. Manager is notified."
              roles={['user']}
              iconBg="bg-emerald-100" iconColor="text-emerald-600"
            />
            <FlowCard
              icon={LogOut}
              title="Log Off (Keep In Progress)"
              description="User logs off without completing. The cell remains orange (In Progress) so another user can continue."
              roles={['user']}
              iconBg="bg-orange-100" iconColor="text-orange-600"
            />
          </div>
          <Arrow label="user can also" />
          <FlowCard
            icon={Map}
            title="Click a Cell to Re-Check In"
            description="If a user taps any non-completed cell polygon on the map (and isn't already checked in), they are shown the check-in modal to book onto it. Tapping their active (orange) cell opens the action menu."
            roles={['user']}
            iconBg="bg-emerald-100" iconColor="text-emerald-600"
          />
        </Section>

        <Arrow />

        {/* ── 4. SIGHTINGS MANAGEMENT ── */}
        <Section title="4 · Sightings Management" subtitle="Viewing, filtering and managing recorded sightings" accent="border-amber-400">
          <FlowCard
            icon={Search}
            title="Browse & Search Sightings"
            description="The Sightings page lists all recorded sightings with photo thumbnails, date, category icon, and notes. Filter by category, search by text, and sort by date or species."
            roles={['admin', 'manager', 'user']}
            iconBg="bg-amber-100" iconColor="text-amber-600"
          />
          <Arrow />
          <FlowCard
            icon={Map}
            title="View Sighting on Map"
            description="Each sighting card has a 'View on Map' button — taps fly the map directly to that sighting's location and activates the relevant category filter."
            roles={['admin', 'manager', 'user']}
            iconBg="bg-amber-100" iconColor="text-amber-600"
          />
          <Arrow />
          <FlowCard
            icon={Pencil}
            title="Move or Update Sightings"
            description="Tapping a map marker shows options: 'View Details' (opens detail modal with photo, notes, coordinates) or 'Move Icon' (drag the marker to correct its position). Photos can also be updated from the detail view."
            roles={['admin', 'manager', 'user']}
            iconBg="bg-amber-100" iconColor="text-amber-600"
          />
        </Section>

        <Arrow />

        {/* ── 5. ADMIN DASHBOARD ── */}
        <Section title="5 · Admin Dashboard" subtitle="Analytics, user management and system oversight" accent="border-primary">
          <FlowCard
            icon={BarChart2}
            title="Analytics"
            description="Overview of cell completion rates, sightings by category, activity over time, and field coverage statistics."
            roles={['admin', 'manager']}
            iconBg="bg-primary/10" iconColor="text-primary"
          />
          <FlowCard
            icon={Building2}
            title="Office Management"
            description="Create, rename and delete offices. Offices group cells and users into operational areas."
            roles={['admin', 'manager']}
            iconBg="bg-primary/10" iconColor="text-primary"
          />
          <FlowCard
            icon={Users}
            title="User Management"
            description="Invite new users, change roles, assign users to offices and managers, view all registered accounts."
            roles={['admin']}
            iconBg="bg-primary/10" iconColor="text-primary"
          />
          <FlowCard
            icon={SquareDashedBottom}
            title="Cells Dashboard"
            description="View all cells, their road mileage totals, completion status, and a log of when each cell was completed and by whom."
            roles={['admin', 'manager']}
            iconBg="bg-primary/10" iconColor="text-primary"
          />
          <FlowCard
            icon={Leaf}
            title="Sightings Dashboard"
            description="Table of all sightings with admin controls to delete records, export data, or view full details."
            roles={['admin', 'manager']}
            iconBg="bg-primary/10" iconColor="text-primary"
          />
        </Section>

        <Arrow />

        {/* ── 6. ADDITIONAL TOOLS ── */}
        <Section title="6 · Additional Tools" subtitle="Supporting features available across the app" accent="border-gray-300">
          <FlowCard
            icon={FlaskConical}
            title="Chemical Logs"
            description="Field users can log weekly chemical usage records — tracking chemical names, units, start and end amounts, and notes for compliance reporting."
            roles={['admin', 'manager', 'user']}
            iconBg="bg-gray-100" iconColor="text-gray-600"
          />
          <FlowCard
            icon={Map}
            title="Route Planning"
            description="From the map menu, enable plotting mode to tap waypoints and calculate total route distance, useful for planning spray runs."
            roles={['admin', 'manager', 'user']}
            iconBg="bg-gray-100" iconColor="text-gray-600"
          />
          <FlowCard
            icon={Search}
            title="Address Search"
            description="The top bar search box lets any user search for an address and fly the map to that location instantly."
            roles={['admin', 'manager', 'user']}
            iconBg="bg-gray-100" iconColor="text-gray-600"
          />
          <FlowCard
            icon={Eye}
            title="Offline Mode"
            description="The app caches cells locally. When offline, sightings are queued and automatically synced to the server when connectivity is restored."
            roles={['user']}
            iconBg="bg-gray-100" iconColor="text-gray-600"
          />
        </Section>

      </div>
    </div>
  );
}