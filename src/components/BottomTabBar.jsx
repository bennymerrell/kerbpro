import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Leaf, SquareDashedBottom } from 'lucide-react';

const TABS = [
  { path: '/', label: 'Map', icon: Map },
  { path: '/sightings', label: 'Sightings', icon: Leaf },
  { path: '/cells', label: 'Cells', icon: SquareDashedBottom },
];

// Save scroll position for the current tab before switching
function saveScrollPosition(pathname) {
  sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY));
}

// Restore scroll position when returning to a tab
function restoreScrollPosition(pathname) {
  const saved = sessionStorage.getItem(`scroll:${pathname}`);
  if (saved) {
    requestAnimationFrame(() => window.scrollTo({ top: parseInt(saved, 10) }));
  }
}

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleTabClick(path) {
    if (pathname === path) {
      // Already active — scroll to top (reset)
      window.scrollTo({ top: 0, behavior: 'smooth' });
      sessionStorage.removeItem(`scroll:${path}`);
    } else {
      // Save current scroll before leaving
      saveScrollPosition(pathname);
      navigate(path);
      // Restore scroll for the tab we're navigating to
      restoreScrollPosition(path);
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[3000] bg-white/95 backdrop-blur-xl border-t border-gray-200/80 print:!hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center">
        {TABS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => handleTabClick(path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors select-none ${active ? 'text-blue-500' : 'text-gray-400'}`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}