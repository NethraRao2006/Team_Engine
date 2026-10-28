import { MessageSquare, Package, Users, ShieldCheck, Sparkles } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  lowStockCount: number;
  totalUdhaar: number;
  auditCountToday: number;
}

export function BottomNav({
  activeTab,
  onTabChange,
  lowStockCount,
  auditCountToday,
}: BottomNavProps) {
  const tabs = [
    { id: 'chat', label: 'Assistant', icon: MessageSquare, badge: null },
    {
      id: 'inventory',
      label: 'Stock',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'udhaar',
      label: 'Udhaar',
      icon: Users,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Audit Log',
      icon: ShieldCheck,
      badge: auditCountToday > 0 ? `${auditCountToday}` : null,
      badgeColor: 'bg-indigo-500',
    },
    {
      id: 'analysis',
      label: 'AI Analysis',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    },
  ];

  return (
    <nav className="flex-none bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 z-40">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 select-none ${
                isActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                />

                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 px-1 min-w-[15px] h-[15px] flex items-center justify-center text-[9px] font-bold text-white rounded-full ${
                      tab.badgeColor || 'bg-rose-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-1 transition-all ${
                  isActive ? 'text-indigo-300 font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
