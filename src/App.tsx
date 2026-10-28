import { useState, useEffect } from 'react';
import { store } from './services/store';
import { Product, Activity, Customer, AuditLogEntry, ShopProfile } from './types';
import { PhoneContainer } from './components/PhoneContainer';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { ChatTab } from './components/ChatTab';
import { InventoryTab } from './components/InventoryTab';
import { UdhaarTab } from './components/UdhaarTab';
import { AuditLogTab } from './components/AuditLogTab';
import { AnalysisTab } from './components/AnalysisTab';
import { QuickActionModal } from './components/QuickActionModal';
import { AddProductModal } from './components/AddProductModal';
import { SettingsModal } from './components/SettingsModal';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [profile, setProfile] = useState<ShopProfile>(store.getShopProfile());

  // Modals
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Synchronize with store
  const refreshState = () => {
    setProducts(store.getProducts());
    setActivities(store.getActivities());
    setCustomers(store.getCustomers());
    setAuditLogs(store.getAuditLogs());
    setProfile(store.getShopProfile());
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = store.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 4500);
  };

  const handleRoleToggle = () => {
    const roles: ('Owner' | 'Cashier' | 'Helper')[] = ['Owner', 'Cashier', 'Helper'];
    const nextIdx = (roles.indexOf(profile.currentRole) + 1) % roles.length;
    const newRole = roles[nextIdx];
    const updated = { ...profile, currentRole: newRole };
    store.saveShopProfile(updated, `System`);
    showToast(`Shift Operator switched to: ${newRole}`);
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const totalUdhaar = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const todayStr = new Date().toDateString();
  const auditCountToday = auditLogs.filter(
    (l) => new Date(l.timestamp).toDateString() === todayStr
  ).length;

  return (
    <PhoneContainer activeTab={activeTab}>
      {/* Mobile Top Header */}
      <MobileHeader
        profile={profile}
        lowStockCount={lowStockCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onRoleToggle={handleRoleToggle}
        onQuickSync={refreshState}
      />

      {/* Main Tab View Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'chat' && (
          <ChatTab
            products={products}
            activities={activities}
            customers={customers}
            profile={profile}
            onNavigateTab={setActiveTab}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            products={products}
            profile={profile}
            onShowToast={showToast}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
          />
        )}

        {activeTab === 'udhaar' && (
          <UdhaarTab
            customers={customers}
            profile={profile}
            onShowToast={showToast}
            onOpenAddCredit={() => setIsQuickActionOpen(true)}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogTab auditLogs={auditLogs} onShowToast={showToast} />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab
            products={products}
            activities={activities}
            customers={customers}
            auditLogs={auditLogs}
            profile={profile}
            onShowToast={showToast}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lowStockCount={lowStockCount}
        totalUdhaar={totalUdhaar}
        auditCountToday={auditCountToday}
      />

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        products={products}
        customers={customers}
        profile={profile}
        onShowToast={showToast}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        profile={profile}
        onShowToast={showToast}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onShowToast={showToast}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="absolute top-14 left-3 right-3 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-slate-800/95 border border-indigo-500/40 backdrop-blur-md text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{toast}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </PhoneContainer>
  );
}
