import React, { useState } from 'react';
import { Package, X, Plus } from 'lucide-react';
import { Product, ShopProfile } from '../types';
import { store } from '../services/store';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ShopProfile;
  onShowToast: (msg: string) => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  profile,
  onShowToast,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('packets');
  const [price, setPrice] = useState('20');
  const [category, setCategory] = useState('Grains & Staples');
  const [color, setColor] = useState<'blue' | 'green' | 'orange' | 'yellow' | 'pink' | 'purple'>('blue');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newProduct: Product = {
      id,
      name: name.trim(),
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      unit,
      price: Number(price) || 0,
      color,
      category,
    };

    store.saveProduct(newProduct, `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`);
    onShowToast(`Added "${name}" to store inventory.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Package size={18} />
            </span>
            <h3 className="text-sm font-bold text-white">Add New Product</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basmati Rice 1kg"
              required
              className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Unit Type
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-800 text-white text-xs px-2 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="packets">packets</option>
                <option value="bags">bags</option>
                <option value="kg">kg</option>
                <option value="bottles">bottles</option>
                <option value="bars">bars</option>
                <option value="jars">jars</option>
                <option value="tubes">tubes</option>
                <option value="loaves">loaves</option>
                <option value="eggs">eggs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Current Stock
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Reorder Alert Min
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                required
                className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="Grains & Staples">Grains & Staples</option>
              <option value="Dairy">Dairy</option>
              <option value="Oils & Ghee">Oils & Ghee</option>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
              <option value="Spices & Essentials">Spices & Essentials</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Household">Household</option>
              <option value="Bakery">Bakery</option>
            </select>
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
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
