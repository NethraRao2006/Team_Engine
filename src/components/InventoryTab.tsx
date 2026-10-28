import React, { useState } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  Plus,
  Minus,
  MessageCircle,
  Filter,
  CheckCircle2,
  Edit2,
  ArrowUpRight,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';
import { Product, ShopProfile } from '../types';
import { store } from '../services/store';

interface InventoryTabProps {
  products: Product[];
  profile: ShopProfile;
  onShowToast: (msg: string) => void;
  onOpenAddProduct: () => void;
}

export function InventoryTab({
  products,
  profile,
  onShowToast,
  onOpenAddProduct,
}: InventoryTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingMinStock, setEditingMinStock] = useState<{ id: string; minStock: number } | null>(null);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'low', label: '⚠️ Low Stock' },
    { id: 'Grains & Staples', label: 'Grains' },
    { id: 'Dairy', label: 'Dairy' },
    { id: 'Oils & Ghee', label: 'Oils & Ghee' },
    { id: 'Beverages', label: 'Beverages' },
    { id: 'Snacks', label: 'Snacks' },
    { id: 'Spices & Essentials', label: 'Spices' },
    { id: 'Personal Care', label: 'Personal Care' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'low') return p.stock <= p.minStock;
    return p.category === selectedCategory;
  });

  const lowStockItems = products.filter((p) => p.stock <= p.minStock);

  const handleAdjust = (productId: string, delta: number) => {
    store.quickAdjustStock(
      productId,
      delta,
      `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`
    );
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      onShowToast(
        delta > 0
          ? `Added +${delta} to ${prod.name}`
          : `Decreased ${prod.name} by ${Math.abs(delta)}`
      );
    }
  };

  const handleSaveMinStock = (productId: string, val: number) => {
    store.updateMinStock(
      productId,
      val,
      `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`
    );
    setEditingMinStock(null);
    onShowToast(`Updated safety stock threshold.`);
  };

  const handleWhatsAppReorder = (itemsToReorder: Product[]) => {
    if (!itemsToReorder.length) {
      onShowToast('No low-stock products to reorder right now.');
      return;
    }

    const lines = itemsToReorder.map(
      (item) => `• ${item.name}: ${Math.max(item.minStock * 2 - item.stock, item.minStock)} ${item.unit}`
    );
    const msg = `Namaste, please send these items for ${profile.name} today:\n\n${lines.join(
      '\n'
    )}\n\nThank you!\n-${profile.ownerName}`;

    const phoneClean = profile.supplierPhone.replace(/\D/g, '');
    const url = `https://wa.me/${phoneClean || ''}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast('Opened WhatsApp reorder draft.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 25+ products..."
              className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition active:scale-95"
            title="Add a custom product to catalog"
          >
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>

        {/* Categories horizontal pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {cat.label}
                {cat.id === 'low' && lowStockItems.length > 0 && (
                  <span className="ml-1 bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                    {lowStockItems.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && selectedCategory !== 'low' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <AlertTriangle size={14} />
            <span>{lowStockItems.length} items below safety level!</span>
          </div>
          <button
            onClick={() => handleWhatsAppReorder(lowStockItems)}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition"
          >
            <MessageCircle size={12} />
            <span>WhatsApp Reorder</span>
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No products match your search or filter.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isLow = prod.stock <= prod.minStock;
            const isEditing = editingMinStock?.id === prod.id;

            return (
              <div
                key={prod.id}
                className={`bg-slate-800/80 rounded-2xl p-3 border transition ${
                  isLow
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Color badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                        prod.color === 'orange'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : prod.color === 'green'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : prod.color === 'purple'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : prod.color === 'yellow'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : prod.color === 'pink'
                          ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      <Package size={17} />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        {prod.name}
                        {isLow && (
                          <span className="bg-rose-500/20 text-rose-300 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border border-rose-500/30">
                            Low
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        ₹{prod.price} / {prod.unit} · {prod.category || 'Pantry'}
                      </p>
                    </div>
                  </div>

                  {/* Stock count */}
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${isLow ? 'text-amber-400' : 'text-slate-100'}`}>
                      {prod.stock}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{prod.unit} left</span>
                  </div>
                </div>

                {/* Counter Adjustment & Min Stock Control */}
                <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                  {/* Safety Stock / Min Stock */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Min alert:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={editingMinStock.minStock}
                          onChange={(e) =>
                            setEditingMinStock({ ...editingMinStock, minStock: Number(e.target.value) })
                          }
                          className="w-12 bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded border border-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveMinStock(prod.id, editingMinStock.minStock)}
                          className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingMinStock({ id: prod.id, minStock: prod.minStock })}
                        className="text-indigo-300 hover:text-indigo-200 font-semibold underline decoration-dotted flex items-center gap-0.5"
                        title="Edit minimum alert threshold"
                      >
                        {prod.minStock} {prod.unit}
                        <Edit2 size={10} />
                      </button>
                    )}
                  </div>

                  {/* Quick Counter Stepper Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjust(prod.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-90 text-slate-200 flex items-center justify-center transition border border-slate-600"
                      title="Sell 1"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-[11px] font-bold text-slate-300 w-4 text-center">±1</span>
                    <button
                      onClick={() => handleAdjust(prod.id, 1)}
                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-90 text-white flex items-center justify-center transition shadow-sm"
                      title="Add 1"
                    >
                      <Plus size={13} />
                    </button>

                    {isLow && (
                      <button
                        onClick={() => handleWhatsAppReorder([prod])}
                        className="ml-1 text-[10px] bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 px-2 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 font-semibold"
                        title="Reorder on WhatsApp"
                      >
                        <MessageCircle size={11} />
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
