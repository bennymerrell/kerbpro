import { forwardRef } from 'react';

/* ─────────────────────────────────────────────
   Draw.io / Lucidchart-style SVG architecture
   Canvas: 1200 × 1800
──────────────────────────────────────────────── */

const W = 1200;
const H = 1900;

/* colour tokens */
const CLR = {
  client:   { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e3a8a', header: '#3b82f6' },
  platform: { fill: '#ede9fe', stroke: '#7c3aed', text: '#3b0764', header: '#7c3aed' },
  external: { fill: '#d1fae5', stroke: '#059669', text: '#064e3b', header: '#059669' },
  node:     { fill: '#ffffff', stroke: '#64748b', text: '#1e293b' },
  fn:       { fill: '#fef9c3', stroke: '#ca8a04', text: '#713f12' },
  entity:   { fill: '#e0e7ff', stroke: '#6366f1', text: '#312e81' },
  ext:      { fill: '#d1fae5', stroke: '#10b981', text: '#064e3b' },
  flow:     { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
  arrow:    '#64748b',
  label:    '#475569',
};

function Rect({ x, y, w, h, fill, stroke, rx = 8 }) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={1.5} />;
}

function Text({ x, y, text, size = 11, bold = false, color = '#1e293b', anchor = 'middle', dy = 0 }) {
  return (
    <text
      x={x} y={y + dy}
      textAnchor={anchor}
      fontSize={size}
      fontWeight={bold ? 700 : 400}
      fill={color}
      fontFamily="Inter, Segoe UI, sans-serif"
    >{text}</text>
  );
}

/* Rounded box with optional subtitle */
function Node({ x, y, w = 130, h = 44, label, sub, fill = '#fff', stroke = '#64748b', textColor = '#1e293b', fontSize = 11 }) {
  const cx = x + w / 2;
  return (
    <g>
      <Rect x={x} y={y} w={w} h={h} fill={fill} stroke={stroke} rx={7} />
      <Text x={cx} y={y + (sub ? h * 0.38 : h / 2 + 1)} text={label} size={fontSize} bold color={textColor} dy={sub ? 0 : 0} />
      {sub && <Text x={cx} y={y + h * 0.65} text={sub} size={9} color={textColor} />}
    </g>
  );
}

/* Swimlane section */
function Lane({ x, y, w, h, label, fill, stroke, headerColor }) {
  return (
    <g>
      <Rect x={x} y={y} w={w} h={h} fill={fill} stroke={stroke} rx={10} />
      <rect x={x} y={y} width={w} height={28} rx={10} fill={headerColor} />
      <rect x={x} y={y + 18} width={w} height={10} fill={headerColor} />
      <Text x={x + w / 2} y={y + 18} text={label} size={11} bold color="#fff" />
    </g>
  );
}

/* Arrow: straight line with arrowhead */
function Arrow({ x1, y1, x2, y2, label, color = CLR.arrow, dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const aLen = 9;
  const ax = x2 - aLen * Math.cos(angle);
  const ay = y2 - aLen * Math.sin(angle);
  const lx = (x1 + x2) / 2;
  const ly = (y1 + y2) / 2;
  return (
    <g>
      <line
        x1={x1} y1={y1} x2={ax} y2={ay}
        stroke={color} strokeWidth={1.5}
        strokeDasharray={dashed ? '6,4' : undefined}
      />
      <polygon
        points={`${x2},${y2} ${ax + 5 * Math.cos(angle - Math.PI / 6)},${ay + 5 * Math.sin(angle - Math.PI / 6)} ${ax + 5 * Math.cos(angle + Math.PI / 6)},${ay + 5 * Math.sin(angle + Math.PI / 6)}`}
        fill={color}
      />
      {label && (
        <text x={lx} y={ly - 5} textAnchor="middle" fontSize={9} fill={CLR.label} fontFamily="Inter, Segoe UI, sans-serif">{label}</text>
      )}
    </g>
  );
}

/* Elbow connector: go down then across then down */
function Elbow({ x1, y1, x2, y2, label, color = CLR.arrow, dashed = false }) {
  const mid = (y1 + y2) / 2;
  const d = `M${x1},${y1} L${x1},${mid} L${x2},${mid} L${x2},${y2}`;
  const angle = Math.atan2(y2 - mid, 0) >= 0 ? 1 : -1;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={dashed ? '6,4' : undefined} />
      <polygon
        points={`${x2},${y2} ${x2 - 5},${y2 - 8} ${x2 + 5},${y2 - 8}`}
        fill={color}
      />
      {label && (
        <text x={(x1 + x2) / 2} y={mid - 4} textAnchor="middle" fontSize={9} fill={CLR.label} fontFamily="Inter, Segoe UI, sans-serif">{label}</text>
      )}
    </g>
  );
}

const ProcessFlowDiagram = forwardRef(function ProcessFlowDiagram(_, ref) {
  return (
    <div ref={ref} style={{ background: '#f8fafc', padding: '24px 20px', width: W + 40, boxSizing: 'border-box', fontFamily: 'Inter, Segoe UI, sans-serif' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>🌿 KerbPro — System Architecture</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
          Current architecture · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CLR.arrow} />
          </marker>
        </defs>

        {/* ══════════════════════════════════════════
            LAYER 1 — CLIENT (y: 10 → 310)
        ══════════════════════════════════════════ */}
        <Lane x={20} y={10} w={W - 40} h={290} label="CLIENT LAYER  ·  Browser / PWA  (React + Vite + react-leaflet + react-router)" fill={CLR.client.fill} stroke={CLR.client.stroke} headerColor={CLR.client.header} />

        {/* Pages row */}
        {[
          { label: 'MapPage', sub: 'Map + cells + sightings' },
          { label: 'SightingsPage', sub: 'List / filter / search' },
          { label: 'CellsPage', sub: 'Status / mileage / edit' },
          { label: 'DashboardPage', sub: 'Admin analytics' },
          { label: 'ChemicalLogPage', sub: 'Weekly usage logs' },
        ].map(({ label, sub }, i) => (
          <Node key={label} x={36 + i * 228} y={50} w={200} h={48} label={label} sub={sub}
            fill="#dbeafe" stroke={CLR.client.stroke} textColor={CLR.client.text} fontSize={11} />
        ))}

        {/* Components row */}
        {[
          { label: 'IOSNavSheet', sub: 'Nav / menu' },
          { label: 'CellCheckInModal', sub: 'Daily check-in' },
          { label: 'SpeciesModal', sub: 'Log sighting + photo' },
          { label: 'SavedCellsLayer', sub: 'Polygon overlay' },
          { label: 'SpeciesMarkers', sub: 'Map pins' },
          { label: 'SearchBox', sub: 'Geocoding UI' },
          { label: 'UserLandingChoice', sub: 'Morning screen' },
        ].map(({ label, sub }, i) => (
          <Node key={label} x={36 + i * 165} y={130} w={148} h={42} label={label} sub={sub}
            fill="#bfdbfe" stroke={CLR.client.stroke} textColor={CLR.client.text} fontSize={10} />
        ))}

        {/* Lib row */}
        {[
          'IndexedDB cache', 'Offline queue', '@tanstack/react-query', 'framer-motion', 'html2canvas + jspdf',
        ].map((label, i) => (
          <g key={label}>
            <rect x={36 + i * 228} y={202} width={200} height={28} rx={5} fill="#eff6ff" stroke="#93c5fd" strokeWidth={1} />
            <text x={136 + i * 228} y={220} textAnchor="middle" fontSize={9.5} fill="#1e40af" fontFamily="Inter,sans-serif">{label}</text>
          </g>
        ))}

        {/* Base44 SDK label */}
        <g>
          <rect x={36} y={246} width={W - 72} height={26} rx={5} fill="#1d4ed8" />
          <text x={W / 2} y={263} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" fontFamily="Inter,sans-serif">Base44 SDK — all API calls routed through SDK (entities · functions · integrations · auth · analytics)</text>
        </g>

        {/* Arrow: Client → Platform */}
        <Arrow x1={W / 2} y1={302} x2={W / 2} y2={335} label="HTTPS / SDK" color="#3b82f6" />

        {/* ══════════════════════════════════════════
            LAYER 2 — BASE44 PLATFORM (y: 338 → 780)
        ══════════════════════════════════════════ */}
        <Lane x={20} y={338} w={W - 40} h={440} label="BASE44 PLATFORM  ·  Backend as a Service" fill={CLR.platform.fill} stroke={CLR.platform.stroke} headerColor={CLR.platform.header} />

        {/* Auth */}
        <Node x={36} y={378} w={170} h={60} label="Authentication" sub="Session · JWT · Roles"
          fill="#f3e8ff" stroke="#7c3aed" textColor="#3b0764" />
        <g>
          {['Login / logout', 'Invite users', 'Role: admin/manager/user', 'updateMe (profile)'].map((t, i) => (
            <text key={t} x={121} y={452 + i * 14} textAnchor="middle" fontSize={9} fill="#4c1d95" fontFamily="Inter,sans-serif">• {t}</text>
          ))}
        </g>

        {/* Database */}
        <Node x={240} y={378} w={200} h={60} label="Database" sub="Entity store · Base44"
          fill="#f3e8ff" stroke="#7c3aed" textColor="#3b0764" />
        {[
          ['Cell', 'Sighting', 'Office', 'User'],
          ['ChemicalLog', 'SprayLog', 'AppSettings', ''],
          ['Manager', 'RolePermissions', '', ''],
        ].map((row, ri) => (
          row.filter(Boolean).map((label, ci) => (
            <g key={label}>
              <rect x={242 + ci * 50} y={452 + ri * 22} width={46} height={18} rx={4} fill="#e0e7ff" stroke="#6366f1" strokeWidth={1} />
              <text x={265 + ci * 50} y={464 + ri * 22} textAnchor="middle" fontSize={8.5} fill="#312e81" fontFamily="Inter,sans-serif">{label}</text>
            </g>
          ))
        ))}

        {/* Backend Functions */}
        <Node x={474} y={378} w={200} h={60} label="Backend Functions" sub="Deno Edge — serverless"
          fill="#fef9c3" stroke="#ca8a04" textColor="#713f12" />
        {[
          'completeCellAndLogOffUsers',
          'notifyCellAction',
          'notifyManagers',
          'processMileageRecalc',
          'triggerMileageRecalc',
          'queryMileage / validateOSMileage',
          'searchAddress',
          'getUsers · updateUser · manageOffice',
        ].map((fn, i) => (
          <text key={fn} x={574} y={453 + i * 14} textAnchor="middle" fontSize={8.5} fill="#78350f" fontFamily="Inter,sans-serif">• {fn}</text>
        ))}

        {/* File Storage */}
        <Node x={708} y={378} w={170} h={60} label="File Storage" sub="CDN-hosted · public URLs"
          fill="#f3e8ff" stroke="#7c3aed" textColor="#3b0764" />
        {['Sighting photos (JPEG)', 'Compressed via UploadFile'].map((t, i) => (
          <text key={t} x={793} y={452 + i * 14} textAnchor="middle" fontSize={9} fill="#4c1d95" fontFamily="Inter,sans-serif">• {t}</text>
        ))}

        {/* Core Integrations */}
        <Node x={912} y={378} w={248} h={60} label="Core Integrations" sub="Built-in Base44 capabilities"
          fill="#f3e8ff" stroke="#7c3aed" textColor="#3b0764" />
        {['InvokeLLM', 'SendEmail (SMTP)', 'UploadFile', 'GenerateImage'].map((t, i) => (
          <text key={t} x={1036} y={452 + i * 14} textAnchor="middle" fontSize={9} fill="#4c1d95" fontFamily="Inter,sans-serif">• {t}</text>
        ))}

        {/* Divider label */}
        <line x1={36} y1={555} x2={W - 36} y2={555} stroke="#c4b5fd" strokeWidth={1} strokeDasharray="4,4" />
        <text x={W / 2} y={568} textAnchor="middle" fontSize={9} fill="#7c3aed" fontWeight={600} fontFamily="Inter,sans-serif">KEY DATA FLOWS</text>

        {/* Flow boxes */}
        {[
          {
            x: 36, title: '🔐 Check-In Flow',
            steps: ['Field User opens app', '→ CellCheckInModal', '→ Cell entity (in_progress)', '→ notifyCellAction fn', '→ Twilio SMS to Manager'],
          },
          {
            x: 316, title: '🍃 Sighting Flow',
            steps: ['User taps Spotted', '→ GPS / pin adjust', '→ UploadFile (photo)', '→ Sighting entity', '→ notifyManagers → Email'],
          },
          {
            x: 596, title: '📐 Mileage Recalc',
            steps: ['Admin triggers recalc', '→ triggerMileageRecalc fn', '→ Overpass API (OSM)', '→ OS Features API', '→ Cell entity updated'],
          },
          {
            x: 876, title: '✅ Cell Finish Flow',
            steps: ['User taps Finish', '→ completeCellAndLogOffUsers', '→ Cell → completed', '→ All users logged off', '→ Twilio SMS to Manager'],
          },
        ].map(({ x, title, steps }) => (
          <g key={title}>
            <rect x={x} y={578} width={260} height={130} rx={8} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} />
            <text x={x + 130} y={596} textAnchor="middle" fontSize={10} fontWeight={700} fill="#92400e" fontFamily="Inter,sans-serif">{title}</text>
            {steps.map((s, i) => (
              <text key={s} x={x + 10} y={614 + i * 18} textAnchor="start" fontSize={9} fill="#78350f" fontFamily="Inter,sans-serif">{s}</text>
            ))}
          </g>
        ))}

        {/* Arrow: Platform → External */}
        <Arrow x1={W / 2} y1={780} x2={W / 2} y2={815} label="API calls" color="#7c3aed" />

        {/* ══════════════════════════════════════════
            LAYER 3 — EXTERNAL SERVICES (y: 818 →1010)
        ══════════════════════════════════════════ */}
        <Lane x={20} y={818} w={W - 40} h={200} label="EXTERNAL SERVICES  ·  Third-party APIs" fill={CLR.external.fill} stroke={CLR.external.stroke} headerColor={CLR.external.header} />

        {[
          { label: 'Twilio', sub: 'SMS / WhatsApp', detail: ['Check-in alerts', 'Cell finish alerts', 'Manager notifs'] },
          { label: 'LocationIQ', sub: 'Geocoding API', detail: ['Address → lat/lng', 'SearchBox results'] },
          { label: 'OS Maps API', sub: 'Ordnance Survey', detail: ['Road mileage validation', 'OS Features API'] },
          { label: 'OpenStreetMap', sub: 'Overpass API', detail: ['Road type breakdown', 'Adopted/unadopted calc'] },
          { label: 'OSM Tile Server', sub: 'Map tiles', detail: ['Street / Satellite', 'OS Road overlay'] },
          { label: 'SMTP (Email)', sub: 'via Base44 Core', detail: ['Sighting HTML reports', 'Manager notifications'] },
        ].map(({ label, sub, detail }, i) => (
          <g key={label}>
            <Node x={36 + i * 192} y={858} w={172} h={46} label={label} sub={sub}
              fill="#d1fae5" stroke="#059669" textColor="#064e3b" fontSize={11} />
            {detail.map((d, di) => (
              <text key={d} x={122 + i * 192} y={918 + di * 13} textAnchor="middle" fontSize={8.5} fill="#065f46" fontFamily="Inter,sans-serif">• {d}</text>
            ))}
          </g>
        ))}

        {/* ══════════════════════════════════════════
            OFFLINE + PWA LAYER (y: 1040 → 1120)
        ══════════════════════════════════════════ */}
        <Lane x={20} y={1055} w={W - 40} h={110} label="OFFLINE / PWA LAYER  ·  Works without internet" fill="#fff7ed" stroke="#f97316" headerColor="#ea580c" />

        {[
          { label: 'Service Worker', sub: 'Cache-first strategy', x: 36 },
          { label: 'IndexedDB', sub: 'Cell polygon cache', x: 290 },
          { label: 'Offline Queue', sub: 'Sightings queued', x: 544 },
          { label: 'PWA Manifest', sub: 'Installable on device', x: 798 },
          { label: 'Auto-sync', sub: 'On reconnect → flush queue', x: 1000 },
        ].map(({ label, sub, x }) => (
          <Node key={label} x={x} y={1092} w={178} h={44} label={label} sub={sub}
            fill="#ffedd5" stroke="#f97316" textColor="#7c2d12" fontSize={10.5} />
        ))}

        {/* ══════════════════════════════════════════
            USER ROLES (y: 1185 → 1320)
        ══════════════════════════════════════════ */}
        <Lane x={20} y={1185} w={W - 40} h={200} label="USER ROLES  ·  Access Control" fill="#fdf4ff" stroke="#a855f7" headerColor="#9333ea" />

        {[
          {
            label: 'Admin', color: '#9333ea', fill: '#f3e8ff',
            perms: ['Full system access', 'Draw / edit / delete cells', 'User & office management', 'Dashboard & analytics', 'Recalculate road mileage', 'Print map / export'],
          },
          {
            label: 'Manager', color: '#2563eb', fill: '#dbeafe',
            perms: ['Receives SMS/WhatsApp alerts', 'Draw cells (map)', 'Dashboard & analytics', 'View sightings dashboard', 'Office management'],
          },
          {
            label: 'Field User', color: '#059669', fill: '#d1fae5',
            perms: ['Morning check-in modal', 'Log in/out of cells', 'Log sightings + photos', 'Browse map & sightings', 'Chemical / spray logs', 'Works offline (PWA)'],
          },
        ].map(({ label, color, fill, perms }, i) => (
          <g key={label}>
            <rect x={36 + i * 385} y={1222} width={360} height={140} rx={8} fill={fill} stroke={color} strokeWidth={1.5} />
            <text x={216 + i * 385} y={1242} textAnchor="middle" fontSize={12} fontWeight={800} fill={color} fontFamily="Inter,sans-serif">{label}</text>
            {perms.map((p, pi) => (
              <text key={p} x={52 + i * 385} y={1262 + pi * 16} textAnchor="start" fontSize={9.5} fill={color} fontFamily="Inter,sans-serif">✓  {p}</text>
            ))}
          </g>
        ))}

        {/* ══════════════════════════════════════════
            FUTURE / PLANNED (y: 1410 → 1520)
        ══════════════════════════════════════════ */}
        <Lane x={20} y={1415} w={W - 40} h={140} label="PLANNED FEATURES  ·  Future Development" fill="#f0fdf4" stroke="#22c55e" headerColor="#16a34a" />

        {[
          { x: 36,  label: 'Reporting Module', sub: 'PDF spray reports per cell/area' },
          { x: 256, label: 'Push Notifications', sub: 'Browser / native push alerts' },
          { x: 476, label: 'Photo Gallery', sub: 'Per-sighting photo history' },
          { x: 696, label: 'Route Optimisation', sub: 'Suggested spray run order' },
          { x: 916, label: 'Native Mobile App', sub: 'iOS & Android (same codebase)' },
        ].map(({ x, label, sub }) => (
          <g key={label}>
            <rect x={x} y={1452} width={200} height={52} rx={7} fill="#dcfce7" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6,3" />
            <text x={x + 100} y={1473} textAnchor="middle" fontSize={10} fontWeight={700} fill="#14532d" fontFamily="Inter,sans-serif">{label}</text>
            <text x={x + 100} y={1490} textAnchor="middle" fontSize={8.5} fill="#166534" fontFamily="Inter,sans-serif">{sub}</text>
          </g>
        ))}

        {/* ── Connector arrows between layers ── */}

        {/* Pages → Components (within client) */}
        {[0,1,2,3,4].map(i => (
          <Arrow key={i} x1={136 + i * 228} y1={98} x2={136 + i * 228} y2={130} color="#3b82f6" />
        ))}

        {/* Functions → Twilio */}
        <Elbow x1={574} y1={440} x2={122} y2={858} label="SMS via Twilio" color="#ca8a04" dashed />

        {/* Functions → OSM */}
        <Elbow x1={574} y1={440} x2={700} y2={858} label="Overpass API" color="#ca8a04" dashed />

        {/* Functions → OS Maps */}
        <Elbow x1={574} y1={440} x2={506} y2={858} label="OS Features" color="#ca8a04" dashed />

        {/* Core Integrations → Email */}
        <Elbow x1={1036} y1={440} x2={1006} y2={858} label="SMTP email" color="#7c3aed" dashed />

        {/* SearchBox → LocationIQ */}
        <Elbow x1={700} y1={172} x2={314} y2={858} label="Geocoding" color="#3b82f6" dashed />

        {/* Client → OSM Tiles */}
        <Elbow x1={136} y1={172} x2={893} y2={858} label="Map tiles" color="#3b82f6" dashed />

        {/* Legend */}
        <g transform={`translate(${W - 260}, 1600)`}>
          <rect x={0} y={0} width={240} height={120} rx={8} fill="#fff" stroke="#e2e8f0" strokeWidth={1.5} />
          <text x={120} y={20} textAnchor="middle" fontSize={10} fontWeight={700} fill="#334155" fontFamily="Inter,sans-serif">LEGEND</text>
          {[
            { color: '#3b82f6', label: 'Client / Frontend call', dashed: false },
            { color: '#7c3aed', label: 'Platform internal call', dashed: false },
            { color: '#ca8a04', label: 'Backend fn → External API', dashed: true },
            { color: '#059669', label: 'External service', dashed: false },
          ].map(({ color, label, dashed }, i) => (
            <g key={label}>
              <line x1={14} y1={38 + i * 20} x2={54} y2={38 + i * 20} stroke={color} strokeWidth={2} strokeDasharray={dashed ? '5,3' : undefined} />
              <polygon points={`54,${38 + i * 20} 48,${34 + i * 20} 48,${42 + i * 20}`} fill={color} />
              <text x={62} y={42 + i * 20} textAnchor="start" fontSize={9} fill="#334155" fontFamily="Inter,sans-serif">{label}</text>
            </g>
          ))}
        </g>

        {/* Footer */}
        <text x={W / 2} y={H - 12} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="Inter,sans-serif">
          KerbPro Field Management System · System Architecture · Confidential
        </text>

      </svg>
    </div>
  );
});

export default ProcessFlowDiagram;