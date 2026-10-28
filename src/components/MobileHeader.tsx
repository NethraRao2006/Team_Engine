import { useState } from 'react';
import { Store, Settings, Plus, Bell, RefreshCw, UserCheck } from 'lucide-react';
import { ShopProfile } from '../types';

interface MobileHeaderProps {
  profile: ShopProfile;
  lowStockCount: number;
  onOpenSettings: () => void;
  onOpenQuickAction: () => void;
  onRoleToggle: () => void;
  onQuickSync: () => void;
}

export function MobileHeader({
  profile,
  lowStockCount,
  onOpenSettings,
  onOpenQuickAction,
  onRoleToggle,
  onQuickSync,
}: MobileHeaderProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSyncClick = () => {
    setSyncing(true);
    onQuickSync();
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <header className="flex-none bg-slate-900 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-30 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
          <Store size={19} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-slate-100 truncate">
              {profile.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRoleToggle}
              className="text-[10px] text-indigo-300 font-medium flex items-center gap-1 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40 hover:bg-indigo-900/60 transition"
              title="Click to toggle Cashier/Owner role"
            >
              <UserCheck size={10} className="text-indigo-400" />
              <span>{profile.currentRole}: {profile.ownerName.split(' ')[0]}</span>
            </button>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Store
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Quick Sync Button */}
        <button
          onClick={handleSyncClick}
          className="p-1.5 text-slate-400 hover:text-slate-200 active:scale-90 transition rounded-lg hover:bg-slate-800"
          title="Refresh store state"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin text-indigo-400' : ''} />
        </button>

        {/* Quick Action (+) Button */}
        <button
          onClick={onOpenQuickAction}
          className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 active:scale-95 transition"
          title="Quick Action (Sale, Stock, Credit)"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-200 active:scale-90 transition rounded-lg hover:bg-slate-800 relative"
          title="Store Settings & Supplier Reorder Config"
        >
          <Settings size={18} />
          {lowStockCount > 0 && (
            <span className="absolute 1 top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </button>
      </div>
    </header>
  );
}
