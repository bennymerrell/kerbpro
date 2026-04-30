import { base44 } from '@/api/base44Client';
import { LogIn, AlertTriangle } from 'lucide-react';

export default function ManagerLogoutModal({ message, onStartNewCell, onDismiss }) {
  async function handleAcknowledge(startNew) {
    // Clear the flag from the user record
    await base44.auth.updateMe({ manager_logout_message: '' });
    if (startNew) {
      onStartNewCell();
    } else {
      onDismiss();
    }
  }

  return (
    <div className="fixed inset-0 z-[9500] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
        <div className="bg-amber-500 px-5 py-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-white font-bold text-lg">Logged Out by Manager</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground text-center leading-relaxed">{message}</p>
          <button
            onClick={() => handleAcknowledge(true)}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Log Into a New Cell
          </button>
          <button
            onClick={() => handleAcknowledge(false)}
            className="w-full h-10 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}