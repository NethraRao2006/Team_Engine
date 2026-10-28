import React, { useState } from 'react';
import {
  Settings,
  X,
  Store,
  Phone,
  MessageCircle,
  QrCode,
  UserCheck,
  RotateCcw,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { ShopProfile } from '../types';
import { store } from '../services/store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ShopProfile;
  onShowToast: (msg: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  profile,
  onShowToast,
}: SettingsModalProps) {
  const [name, setName] = useState(profile.name);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [supplierPhone, setSupplierPhone] = useState(profile.supplierPhone);
  const [upiId, setUpiId] = useState(profile.upiId);
  const [currentRole, setCurrentRole] = useState<'Owner' | 'Cashier' | 'Helper'>(profile.currentRole);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveShopProfile(
      {
        ...profile,
        name: name.trim() || 'Kirana Store',
        ownerName: ownerName.trim() || 'Owner',
        supplierPhone: supplierPhone.trim() || '919876543210',
        upiId: upiId.trim() || 'store@upi',
        currentRole,
      },
      `${currentRole} (${ownerName.split(' ')[0]})`
    );
    onShowToast('Shop settings updated.');
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset all inventory, customers, and audit logs to the initial starter set?')) {
      store.resetAll();
      onShowToast('Store reset to starter configuration.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Settings size={18} />
            </span>
            <h3 className="text-sm font-bold text-white">Store Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Shop Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Owner Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Active Shift Operator
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl text-[11px] font-semibold">
              {(['Owner', 'Cashier', 'Helper'] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setCurrentRole(r)}
                  className={`py-1.5 rounded-lg transition ${
                    currentRole === r
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Audit logs tag every sale and stock update with this active operator.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <MessageCircle size={12} className="text-emerald-400" />
              Supplier WhatsApp Phone
            </label>
            <input
              type="text"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="e.g. 919876543210"
              className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <QrCode size={12} className="text-indigo-400" />
              Shop UPI ID (for Udhaar QR & Reminders)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. sharmastore@okhdfcbank"
              className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition active:scale-95"
            >
              Save Settings
            </button>
          </div>
        </form>

        {/* Project ZIP Backup */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <a
            href="/download/team_engine.zip"
            download="team_engine.zip"
            className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition active:scale-95"
          >
            <Download size={14} />
            <span>Download Project ZIP (Complete Code)</span>
          </a>
          <p className="text-[10px] text-slate-400 text-center">
            Includes all components, audit log engine, Gemini API integration, and assets.
          </p>
        </div>

        {/* Danger zone / Reset */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-1.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs py-2 rounded-xl border border-rose-800/40 transition"
          >
            <RotateCcw size={13} />
            <span>Reset Demo Store & Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
