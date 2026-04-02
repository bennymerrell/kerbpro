import { Link, useLocation } from 'react-router-dom';
import { Map, Leaf, SquareDashedBottom } from 'lucide-react';

const TABS = [
  { path: '/', label: 'Map', icon: Map },
  { path: '/sightings', label: 'Sightings', icon: Leaf },
  { path: '/cells', label: 'Cells', icon: SquareDashedBottom },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[3000] bg-white/95 backdrop-blur-xl border-t border-gray-200/80 print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center">
        {TABS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors select-none ${active ? 'text-blue-500' : 'text-gray-400'}`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}