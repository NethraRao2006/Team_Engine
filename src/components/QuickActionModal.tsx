import React, { useState } from 'react';
import {
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  X,
  IndianRupee,
} from 'lucide-react';
import { Product, Customer, ShopProfile } from '../types';
import { store } from '../services/store';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  profile: ShopProfile;
  onShowToast: (msg: string) => void;
}

export function QuickActionModal({
  isOpen,
  onClose,
  products,
  customers,
  profile,
  onShowToast,
}: QuickActionModalProps) {
  const [actionType, setActionType] = useState<'sale' | 'restock' | 'credit' | 'payment'>('sale');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actor = `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`;

    if (actionType === 'sale' || actionType === 'restock') {
      const prod = products.find((p) => p.id === selectedProductId);
      const qty = Number(quantity);
      if (!prod || qty <= 0) {
        onShowToast('Select a product and valid quantity.');
        return;
      }

      if (actionType === 'sale' && prod.stock < qty) {
        onShowToast(`Insufficient stock! ${prod.name} has only ${prod.stock} ${prod.unit}.`);
        return;
      }

      const delta = actionType === 'sale' ? -qty : qty;
      store.quickAdjustStock(prod.id, delta, actor);

      // Record Activity
      store.addActivity({
        id: 'act-' + Date.now(),
        type: actionType === 'sale' ? 'sold' : 'received',
        message: `${actionType === 'sale' ? 'Sold' : 'Received'} ${qty} ${prod.unit} of ${prod.name}`,
        items: [
          {
            name: prod.name,
            quantity: qty,
            before: prod.stock,
            after: prod.stock + delta,
            unit: prod.unit,
            price: prod.price,
          },
        ],
        amount: actionType === 'sale' ? qty * prod.price : undefined,
        createdAt: new Date().toISOString(),
        actor,
        channel: 'quick_action',
      });

      onShowToast(
        actionType === 'sale'
          ? `Recorded sale of ${qty} ${prod.unit} ${prod.name} (₹${qty * prod.price})`
          : `Restocked ${qty} ${prod.unit} ${prod.name}`
      );
      onClose();
    } else if (actionType === 'credit') {
      const cust = customerName.trim();
      const amt = Number(amount);
      if (!cust || amt <= 0) {
        onShowToast('Enter customer name and valid credit amount.');
        return;
      }

      store.addCustomerCredit(cust, amt, undefined, actor, 'quick_action');
      onShowToast(`Added ₹${amt} udhaar for ${cust}.`);
      onClose();
    } else if (actionType === 'payment') {
      const cust = customerName.trim();
      const amt = Number(amount);
      if (!cust || amt <= 0) {
        onShowToast('Enter customer name and valid payment amount.');
        return;
      }

      try {
        store.recordCustomerPayment(cust, amt, actor, 'quick_action');
        onShowToast(`Recorded ₹${amt} payment from ${cust}.`);
        onClose();
      } catch (err: any) {
        onShowToast(err.message || 'Error recording payment.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Plus size={18} />
            </span>
            <h3 className="text-sm font-bold text-white">Quick Counter Action</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Action Type Selector */}
        <div className="grid grid-cols-4 gap-1 bg-slate-800 p-1 rounded-xl text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActionType('sale')}
            className={`py-1.5 rounded-lg transition ${
              actionType === 'sale' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sale
          </button>
          <button
            type="button"
            onClick={() => setActionType('restock')}
            className={`py-1.5 rounded-lg transition ${
              actionType === 'restock' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stock +
          </button>
          <button
            type="button"
            onClick={() => setActionType('credit')}
            className={`py-1.5 rounded-lg transition ${
              actionType === 'credit' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Udhaar
          </button>
          <button
            type="button"
            onClick={() => setActionType('payment')}
            className={`py-1.5 rounded-lg transition ${
              actionType === 'payment' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Payment
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {(actionType === 'sale' || actionType === 'restock') && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} {p.unit} in stock - ₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-800 text-white text-sm font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </>
          )}

          {(actionType === 'credit' || actionType === 'payment') && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  list="customers-list"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
                <datalist id="customers-list">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₹ 100"
                  className="w-full bg-slate-800 text-white text-sm font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </>
          )}

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
              Save Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
