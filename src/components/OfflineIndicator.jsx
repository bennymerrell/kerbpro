import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator({ isOnline }) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[5000] bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
      <WifiOff className="h-4 w-4" />
      You are offline – cached data is available
    </div>
  );
}