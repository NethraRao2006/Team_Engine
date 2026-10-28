import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  CreditCard,
  MessageCircle,
  IndianRupee,
  CheckCircle2,
  Clock,
  Phone,
  QrCode,
} from 'lucide-react';
import { Customer, ShopProfile } from '../types';
import { store } from '../services/store';

interface UdhaarTabProps {
  customers: Customer[];
  profile: ShopProfile;
  onShowToast: (msg: string) => void;
  onOpenAddCredit: () => void;
}

export function UdhaarTab({
  customers,
  profile,
  onShowToast,
  onOpenAddCredit,
}: UdhaarTabProps) {
  const [search, setSearch] = useState('');
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      onShowToast('Enter a valid payment amount.');
      return;
    }

    try {
      store.recordCustomerPayment(
        payingCustomer.name,
        amt,
        `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`,
        'manual_ui'
      );
      onShowToast(`Settled ₹${amt} for ${payingCustomer.name}.`);
      setPayingCustomer(null);
      setPaymentAmount('');
    } catch (err: any) {
      onShowToast(err.message || 'Error recording payment.');
    }
  };

  const handleSendReminder = (customer: Customer, lang: 'en' | 'kn' = 'en') => {
    const text =
      lang === 'kn'
        ? `ನಮಸ್ಕಾರ ${customer.name} ಅವರೇ,\n${profile.name} ನಲ್ಲಿ ನಿಮ್ಮ ಬಾಕಿ ಮೊತ್ತ: ₹${customer.balance.toLocaleString(
            'en-IN'
          )} ಆಗಿದೆ.\n\nUPI ಮೂಲಕ ಪಾವತಿಸಲು: ${profile.upiId}\nಧನ್ಯವಾದಗಳು!\n-${profile.ownerName}`
        : `Namaste ${customer.name} ji,\nThis is a gentle reminder from ${profile.name}.\nYour pending udhaar balance is ₹${customer.balance.toLocaleString(
            'en-IN'
          )}.\n\nPay via UPI: ${profile.upiId} or cash at store.\nThank you!\n-${profile.ownerName}`;

    const phoneClean = (customer.phone || '').replace(/\D/g, '');
    const url = `https://wa.me/${phoneClean ? `91${phoneClean}` : ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast(`Opened WhatsApp payment reminder for ${customer.name}.`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden">
      {/* Hero Stats Card */}
      <div className="p-3 bg-slate-900 border-b border-slate-800">
        <div className="bg-gradient-to-r from-rose-900/40 to-slate-800 border border-rose-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
              <Users size={12} />
              Pending Udhaar Ledger
            </span>
            <div className="text-xl font-extrabold text-white mt-1">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Across {customers.length} registered customers
            </p>
          </div>

          <button
            onClick={onOpenAddCredit}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md transition active:scale-95"
            title="Add new customer udhaar record"
          >
            <Plus size={15} />
            <span>Add Credit</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-2.5">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name or phone..."
            className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No customer udhaar accounts found.</p>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const hasPending = c.balance > 0;

            return (
              <div
                key={c.id}
                className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 hover:border-slate-600 transition space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center font-bold text-slate-200 text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{c.name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone size={11} />
                        {c.phone || 'No phone saved'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold ${
                        hasPending ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ₹{c.balance.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {hasPending ? 'Outstanding' : 'All clear'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {hasPending && (
                      <>
                        <button
                          onClick={() => handleSendReminder(c, 'en')}
                          className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded-lg border border-slate-600 flex items-center gap-1 font-medium transition"
                          title="Send reminder in English"
                        >
                          <MessageCircle size={11} className="text-emerald-400" />
                          <span>Reminder (EN)</span>
                        </button>
                        <button
                          onClick={() => handleSendReminder(c, 'kn')}
                          className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded-lg border border-slate-600 flex items-center gap-1 font-medium transition"
                          title="Send reminder in Kannada"
                        >
                          <MessageCircle size={11} className="text-emerald-400" />
                          <span>ಜ್ಞಾಪನೆ (KN)</span>
                        </button>
                      </>
                    )}
                  </div>

                  {hasPending && (
                    <button
                      onClick={() => {
                        setPayingCustomer(c);
                        setPaymentAmount(String(c.balance));
                      }}
                      className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1"
                    >
                      <CreditCard size={12} />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Payment Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Record Customer Payment</h3>
                <p className="text-xs text-slate-400">Customer: {payingCustomer.name}</p>
              </div>
              <button
                onClick={() => setPayingCustomer(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Cancel
              </button>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Outstanding:</span>
              <strong className="text-rose-400 text-sm">₹{payingCustomer.balance.toLocaleString('en-IN')}</strong>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Payment Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingCustomer.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 200"
                  required
                  autoFocus
                  className="w-full bg-slate-800 text-white text-base font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex gap-1.5">
                {[50, 100, 200, 500].filter((val) => val <= payingCustomer.balance).map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setPaymentAmount(String(chip))}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-xs py-1 rounded-lg border border-slate-700 text-slate-200"
                  >
                    ₹{chip}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(payingCustomer.balance))}
                  className="flex-1 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 text-xs py-1 rounded-lg border border-indigo-700 font-semibold"
                >
                  Full (₹{payingCustomer.balance})
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition active:scale-95"
                >
                  Confirm ₹{paymentAmount || 0}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
