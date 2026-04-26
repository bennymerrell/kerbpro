import { forwardRef } from 'react';

/* ── helpers ── */
function Box({ label, sub, color, textColor = '#fff', width = 130, height = 44, fontSize = 11 }) {
  return (
    <div style={{
      width, height,
      background: color,
      borderRadius: 8,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '4px 8px',
      boxSizing: 'border-box',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    }}>
      <div style={{ fontSize, fontWeight: 700, color: textColor, textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: textColor, opacity: 0.75, textAlign: 'center', marginTop: 2, lineHeight: 1.2 }}>{sub}</div>}
    </div>
  );
}

function Layer({ title, color, children, style = {} }) {
  return (
    <div style={{
      border: `2px solid ${color}`,
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
      ...style,
    }}>
      <div style={{ background: color, padding: '6px 14px' }}>
        <div style={{ fontWeight: 800, fontSize: 11, color: '#fff', letterSpacing: 0.3 }}>{title}</div>
      </div>
      <div style={{ padding: '14px 12px' }}>
        {children}
      </div>
    </div>
  );
}

function HLine({ width = 40 }) {
  return <div style={{ width, height: 2, background: '#94a3b8', flexShrink: 0 }} />;
}

function VLine({ height = 20 }) {
  return <div style={{ width: 2, height, background: '#94a3b8', margin: '0 auto' }} />;
}

function Arrow({ dir = 'down', label }) {
  const isH = dir === 'right' || dir === 'left';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <VLine height={14} />
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '8px solid #94a3b8',
      }} />
      {label && <div style={{ fontSize: 8.5, color: '#94a3b8', fontWeight: 600 }}>{label}</div>}
    </div>
  );
}

function HArrow({ label, reverse = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {reverse && (
        <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '7px solid #94a3b8' }} />
      )}
      <HLine width={30} />
      {!reverse && (
        <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '7px solid #94a3b8' }} />
      )}
      {label && <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, position: 'absolute' }}>{label}</div>}
    </div>
  );
}

function ConnLine({ label } = {}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 0' }}>
      <VLine height={10} />
      <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '7px solid #94a3b8' }} />
      {label && <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, marginTop: 2 }}>{label}</div>}
    </div>
  );
}

function Row({ children, gap = 8, center = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: center ? 'center' : 'flex-start', gap, justifyContent: 'center' }}>
      {children}
    </div>
  );
}

function Col({ children, gap = 6, center = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-start', gap }}>
      {children}
    </div>
  );
}

function Note({ text, color = '#f1f5f9', textColor = '#475569' }) {
  return (
    <div style={{ background: color, borderRadius: 6, padding: '4px 8px', fontSize: 9, color: textColor, fontStyle: 'italic', textAlign: 'center' }}>
      {text}
    </div>
  );
}

const ProcessFlowDiagram = forwardRef(function ProcessFlowDiagram(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 860,
        background: '#f8fafc',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: '28px 32px 40px',
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>🌿 KerbPro — System Architecture Diagram</div>
        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>Current technical architecture · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── CLIENTS ── */}
        <Layer title="CLIENT LAYER — Browser / PWA (React + Vite)" color="#6366f1">
          <Row gap={10}>
            <Col center gap={5}>
              <Box label="MapPage" sub="Leaflet map, cells, sightings" color="#4338ca" width={140} />
            </Col>
            <Col center gap={5}>
              <Box label="SightingsPage" sub="List, filter, search" color="#4338ca" width={140} />
            </Col>
            <Col center gap={5}>
              <Box label="CellsPage" sub="Status, mileage, edit" color="#4338ca" width={140} />
            </Col>
            <Col center gap={5}>
              <Box label="DashboardPage" sub="Analytics & admin" color="#4338ca" width={140} />
            </Col>
            <Col center gap={5}>
              <Box label="ChemicalLogPage" sub="Weekly usage logs" color="#4338ca" width={140} />
            </Col>
          </Row>
          <div style={{ marginTop: 10, marginBottom: 6 }}>
            <Row gap={8}>
              <Box label="IOSNavSheet" sub="Menu / nav" color="#818cf8" textColor="#fff" width={115} height={38} />
              <Box label="CellCheckInModal" sub="Daily check-in" color="#818cf8" textColor="#fff" width={130} height={38} />
              <Box label="SpeciesModal" sub="Log sighting + photo" color="#818cf8" textColor="#fff" width={130} height={38} />
              <Box label="SavedCellsLayer" sub="Polygon overlay" color="#818cf8" textColor="#fff" width={125} height={38} />
              <Box label="SpeciesMarkers" sub="Map pins" color="#818cf8" textColor="#fff" width={115} height={38} />
              <Box label="SearchBox" sub="Geocoding UI" color="#818cf8" textColor="#fff" width={110} height={38} />
            </Row>
          </div>
          <Row gap={20}>
            <Note text="React Router v6 — client-side routing" />
            <Note text="@tanstack/react-query — data fetching + caching" />
            <Note text="react-leaflet — interactive maps" />
            <Note text="framer-motion — page transitions" />
            <Note text="IndexedDB — offline cell cache" />
            <Note text="Offline queue — sighting sync" />
          </Row>
        </Layer>

        <ConnLine label="Base44 SDK / HTTP" />

        {/* ── BASE44 PLATFORM ── */}
        <Layer title="BASE44 PLATFORM — Backend as a Service" color="#0ea5e9">
          <Row gap={16}>

            {/* Auth */}
            <Col center gap={5}>
              <Box label="Authentication" sub="Session / JWT" color="#0284c7" width={138} />
              <Note text="Login · Invite · Roles" />
            </Col>

            {/* Database */}
            <Col center gap={5}>
              <Box label="Database" sub="Entity store" color="#0284c7" width={138} />
              <Row gap={4}>
                <Note text="Cell" color="#e0f2fe" textColor="#0369a1" />
                <Note text="Sighting" color="#e0f2fe" textColor="#0369a1" />
                <Note text="Office" color="#e0f2fe" textColor="#0369a1" />
              </Row>
              <Row gap={4}>
                <Note text="User" color="#e0f2fe" textColor="#0369a1" />
                <Note text="ChemicalLog" color="#e0f2fe" textColor="#0369a1" />
                <Note text="SprayLog" color="#e0f2fe" textColor="#0369a1" />
              </Row>
              <Row gap={4}>
                <Note text="AppSettings" color="#e0f2fe" textColor="#0369a1" />
                <Note text="Manager" color="#e0f2fe" textColor="#0369a1" />
                <Note text="RolePermissions" color="#e0f2fe" textColor="#0369a1" />
              </Row>
            </Col>

            {/* Functions */}
            <Col center gap={5}>
              <Box label="Backend Functions" sub="Deno Edge" color="#0284c7" width={138} />
              <Note text="completeCellAndLogOffUsers" />
              <Note text="notifyCellAction" />
              <Note text="notifyManagers" />
              <Note text="processMileageRecalc" />
              <Note text="queryMileage" />
              <Note text="triggerMileageRecalc" />
              <Note text="validateOSMileage" />
              <Note text="searchAddress" />
              <Note text="getUsers · updateUser" />
              <Note text="manageOffice" />
            </Col>

            {/* File Storage */}
            <Col center gap={5}>
              <Box label="File Storage" sub="CDN-hosted" color="#0284c7" width={138} />
              <Note text="Sighting photos (JPEG)" />
              <Note text="Compressed via UploadFile" />
            </Col>

            {/* Built-in Integrations */}
            <Col center gap={5}>
              <Box label="Core Integrations" sub="Built-in" color="#0284c7" width={138} />
              <Note text="InvokeLLM" />
              <Note text="SendEmail" />
              <Note text="UploadFile" />
              <Note text="GenerateImage" />
            </Col>

          </Row>
        </Layer>

        <ConnLine label="API / SDK calls" />

        {/* ── EXTERNAL SERVICES ── */}
        <Layer title="EXTERNAL SERVICES — Third-party APIs" color="#10b981">
          <Row gap={12}>

            <Col center gap={5}>
              <Box label="Twilio" sub="SMS / WhatsApp" color="#047857" width={130} />
              <Note text="Check-in alerts" />
              <Note text="Cell finish alerts" />
              <Note text="Manager notifications" />
            </Col>

            <Col center gap={5}>
              <Box label="LocationIQ" sub="Geocoding API" color="#047857" width={130} />
              <Note text="Address → lat/lng" />
              <Note text="Search box results" />
            </Col>

            <Col center gap={5}>
              <Box label="OS Maps API" sub="Ordnance Survey" color="#047857" width={130} />
              <Note text="Road mileage validation" />
              <Note text="OS Features API" />
            </Col>

            <Col center gap={5}>
              <Box label="OpenStreetMap" sub="Overpass API" color="#047857" width={130} />
              <Note text="Road type breakdown" />
              <Note text="Adopted/unadopted calc" />
            </Col>

            <Col center gap={5}>
              <Box label="OSM Tile Server" sub="Map tiles" color="#047857" width={130} />
              <Note text="Street / Satellite" />
              <Note text="OS Road tiles" />
            </Col>

            <Col center gap={5}>
              <Box label="Email (SMTP)" sub="via Base44 Core" color="#047857" width={130} />
              <Note text="Sighting reports" />
              <Note text="HTML email to managers" />
            </Col>

          </Row>
        </Layer>

        <ConnLine />

        {/* ── DATA FLOW SUMMARY ── */}
        <Layer title="KEY DATA FLOWS" color="#f59e0b">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

            {/* Flow 1 */}
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', border: '1px solid #fcd34d' }}>
              <div style={{ fontWeight: 700, fontSize: 10.5, color: '#92400e', marginBottom: 6 }}>🔐 Check-In Flow</div>
              <Row gap={4}>
                <Note text="Field User" color="#d1fae5" textColor="#065f46" />
                <HArrow />
                <Note text="CellCheckInModal" color="#e0e7ff" textColor="#3730a3" />
                <HArrow />
                <Note text="Cell entity (in_progress)" color="#dbeafe" textColor="#1e40af" />
              </Row>
              <div style={{ marginTop: 4 }}>
                <Row gap={4}>
                  <Note text="updateMe (active_cell_id)" color="#e0e7ff" textColor="#3730a3" />
                  <HArrow />
                  <Note text="notifyCellAction" color="#e0e7ff" textColor="#3730a3" />
                  <HArrow />
                  <Note text="Twilio SMS" color="#d1fae5" textColor="#065f46" />
                </Row>
              </div>
            </div>

            {/* Flow 2 */}
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', border: '1px solid #fcd34d' }}>
              <div style={{ fontWeight: 700, fontSize: 10.5, color: '#92400e', marginBottom: 6 }}>🍃 Sighting Flow</div>
              <Row gap={4}>
                <Note text="GPS / pin adjust" color="#d1fae5" textColor="#065f46" />
                <HArrow />
                <Note text="SpeciesModal" color="#e0e7ff" textColor="#3730a3" />
                <HArrow />
                <Note text="UploadFile" color="#dbeafe" textColor="#1e40af" />
              </Row>
              <div style={{ marginTop: 4 }}>
                <Row gap={4}>
                  <Note text="Sighting entity" color="#dbeafe" textColor="#1e40af" />
                  <HArrow />
                  <Note text="notifyManagers fn" color="#e0e7ff" textColor="#3730a3" />
                  <HArrow />
                  <Note text="HTML Email" color="#d1fae5" textColor="#065f46" />
                </Row>
              </div>
            </div>

            {/* Flow 3 */}
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', border: '1px solid #fcd34d' }}>
              <div style={{ fontWeight: 700, fontSize: 10.5, color: '#92400e', marginBottom: 6 }}>📐 Mileage Recalc Flow</div>
              <Row gap={4}>
                <Note text="Admin triggers recalc" color="#d1fae5" textColor="#065f46" />
                <HArrow />
                <Note text="triggerMileageRecalc fn" color="#e0e7ff" textColor="#3730a3" />
              </Row>
              <div style={{ marginTop: 4 }}>
                <Row gap={4}>
                  <Note text="Overpass API" color="#d1fae5" textColor="#065f46" />
                  <HArrow />
                  <Note text="OS Features API" color="#d1fae5" textColor="#065f46" />
                  <HArrow />
                  <Note text="Cell entity updated" color="#dbeafe" textColor="#1e40af" />
                </Row>
              </div>
            </div>

            {/* Flow 4 */}
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', border: '1px solid #fcd34d' }}>
              <div style={{ fontWeight: 700, fontSize: 10.5, color: '#92400e', marginBottom: 6 }}>✅ Cell Finish Flow</div>
              <Row gap={4}>
                <Note text="User taps Finish" color="#d1fae5" textColor="#065f46" />
                <HArrow />
                <Note text="completeCellAndLogOffUsers fn" color="#e0e7ff" textColor="#3730a3" />
              </Row>
              <div style={{ marginTop: 4 }}>
                <Row gap={4}>
                  <Note text="Cell → completed" color="#dbeafe" textColor="#1e40af" />
                  <HArrow />
                  <Note text="All users logged off" color="#dbeafe" textColor="#1e40af" />
                  <HArrow />
                  <Note text="Twilio SMS" color="#d1fae5" textColor="#065f46" />
                </Row>
              </div>
            </div>

          </div>
        </Layer>

      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 9.5, color: '#94a3b8' }}>
        KerbPro Field Management System · Architecture Diagram · Confidential
      </div>
    </div>
  );
});

export default ProcessFlowDiagram;