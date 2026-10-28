import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Package, Users, ShoppingCart, 
  FileText, Send, Mic, Menu, X 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // --- STATE WITH LOCALSTORAGE PERSISTENCE ---
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('kirana_inventory');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Maggi', stock: 40, minLevel: 10, price: 14, category: 'Snacks' },
      { id: 2, name: 'Milk', stock: 12, minLevel: 5, price: 28, category: 'Dairy' },
      { id: 3, name: 'Rice', stock: 5, minLevel: 10, price: 60, category: 'Grains' },
      { id: 4, name: 'Cooking Oil', stock: 2, minLevel: 5, price: 130, category: 'Groceries' },
      { id: 5, name: 'Biscuits', stock: 3, minLevel: 8, price: 20, category: 'Snacks' },
      { id: 6, name: 'Sugar', stock: 5, minLevel: 10, price: 42, category: 'Groceries' }
    ];
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('kirana_messages');
    return saved ? JSON.parse(saved) : [
      { sender: 'user', text: 'Sold 3 Maggi and 2 milk packets', time: '10:24 AM' },
      { sender: 'bot', text: '✅ Stock updated successfully!\n• Maggi: 40 → 37 (sold 3)\n• Milk: 12 → 10 (sold 2)', time: '10:24 AM' },
      { sender: 'user', text: 'Received 20 rice bags', time: '10:24 AM' },
      { sender: 'bot', text: '✅ New stock added!\n• Rice: 5 → 25 (received 20)', time: '10:24 AM' },
      { sender: 'user', text: 'Ramesh took 2 rice bags on credit', time: '10:28 AM' },
      { sender: 'bot', text: '✅ Credit recorded!\n👤 Ramesh | Item: Rice (2) | Total Udhaar: ₹1,500', time: '10:28 AM' }
    ];
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('kirana_customers');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Ramesh', phone: '9876543210', balance: 1500 },
      { id: 2, name: 'Suresh Kumar', phone: '9123456789', balance: 450 },
      { id: 3, name: 'Anita Sharma', phone: '9988776655', balance: 300 }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('kirana_inventory', JSON.stringify(inventory));
    localStorage.setItem('kirana_messages', JSON.stringify(messages));
    localStorage.setItem('kirana_customers', JSON.stringify(customers));
  }, [inventory, messages, customers]);

  // --- COMMAND PARSER ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setInputMessage('');
    processCommand(userText, timeStr);
  };

  const processCommand = (text, timeStr) => {
    const lower = text.toLowerCase();
    let botReply = '';

    if (lower.includes('sold') || lower.includes('sale')) {
      let updatedInv = [...inventory];
      let details = [];

      updatedInv = updatedInv.map(item => {
        const regex = new RegExp(`(\\d+)\\s*${item.name.toLowerCase()}`, 'i');
        const match = text.match(regex);
        if (match) {
          const qty = parseInt(match[1]);
          const oldStock = item.stock;
          item.stock = Math.max(0, item.stock - qty);
          details.push(`• ${item.name}: ${oldStock} → ${item.stock} (sold ${qty})`);
        }
        return item;
      });

      setInventory(updatedInv);
      botReply = `✅ Stock updated successfully!\n${details.join('\n')}`;
    } 
    else if (lower.includes('received') || lower.includes('got') || lower.includes('added')) {
      let updatedInv = [...inventory];
      let details = [];

      updatedInv = updatedInv.map(item => {
        const regex = new RegExp(`(\\d+)\\s*${item.name.toLowerCase()}`, 'i');
        const match = text.match(regex);
        if (match) {
          const qty = parseInt(match[1]);
          const oldStock = item.stock;
          item.stock += qty;
          details.push(`• ${item.name}: ${oldStock} → ${item.stock} (received ${qty})`);
        }
        return item;
      });

      setInventory(updatedInv);
      botReply = `✅ New stock added!\n${details.join('\n')}`;
    }
    else if (lower.includes('credit') || lower.includes('took')) {
      const customerMatch = customers.find(c => lower.includes(c.name.toLowerCase())) || customers[0];
      let itemFound = inventory.find(i => lower.includes(i.name.toLowerCase())) || inventory[2];
      
      const qtyMatch = text.match(/(\d+)/);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const amount = qty * itemFound.price;

      setCustomers(customers.map(c => c.id === customerMatch.id ? { ...c, balance: c.balance + amount } : c));
      setInventory(inventory.map(i => i.id === itemFound.id ? { ...i, stock: Math.max(0, i.stock - qty) } : i));

      botReply = `✅ Credit recorded!\n👤 Customer: ${customerMatch.name}\n📦 Item: ${itemFound.name} (${qty})\n📊 New Balance: ₹${customerMatch.balance + amount}`;
    }
    else {
      botReply = `🤖 Processed: "${text}". Try commands like "sold 3 maggi", "received 20 rice", or "Ramesh took 2 rice on credit".`;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: botReply, time: timeStr }]);
    }, 400);
  };

  const lowStockItems = inventory.filter(i => i.stock <= i.minLevel);
  const totalUdhaarVal = customers.reduce((sum, c) => sum + c.balance, 0);

  const generateWhatsAppLink = () => {
    const listText = lowStockItems.map(i => `• ${i.name}: Need ${i.minLevel * 2 - i.stock} units`).join('%0A');
    const msg = `Hello Supplier,%0APlease deliver low-stock items:%0A${listText}`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const navigationItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customers', label: 'Udhaar', icon: Users },
    { id: 'reorder', label: 'Reorder', icon: ShoppingCart },
    { id: 'summary', label: 'Summary', icon: FileText }
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden flex-col md:flex-row">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between border-r border-slate-800">
        <div>
          <div className="p-4 flex items-center space-x-3 border-b border-slate-800">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <ShoppingCart size={22} />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide">KiranaShop</h1>
              <span className="text-xs text-indigo-400 font-medium">Assistant</span>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <p className="text-sm font-semibold text-white">Sharma General Store</p>
          <p className="text-xs text-slate-400">Owner Account</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-base md:text-lg font-bold text-slate-900">Good Morning, Ramesh! ☀️</h2>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">Online</span>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <main className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                        <span className="text-[10px] block text-right opacity-70 mt-1">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white border-t p-3">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2 bg-slate-100 rounded-xl px-3 py-2 border">
                    <Mic size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="e.g. sold 3 maggi or Ramesh took 2 rice on credit"
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg"><Send size={14} /></button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-bold">Live Inventory Stock</h3>
                <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Stock Level</th>
                        <th className="p-3">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3 font-bold text-indigo-600">{item.stock} units</td>
                          <td className="p-3">₹{item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-bold">Customer Udhaar Ledger</h3>
                <div className="grid gap-3">
                  {customers.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                      <div>
                        <p className="font-bold">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone}</p>
                      </div>
                      <p className="text-sm font-bold text-red-600">₹{c.balance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'reorder' || activeTab === 'summary') && (
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-bold">Supplier Reorder & Summary</h3>
                <div className="bg-white p-4 rounded-xl border space-y-3">
                  <button onClick={generateWhatsAppLink} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">
                    Send Supplier Reorder Message (WhatsApp)
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Right Dashboard Panel */}
          <aside className="w-full lg:w-80 bg-white border-l border-slate-200 p-4 space-y-6 overflow-y-auto hidden lg:block">
            <div>
              <h4 className="font-bold text-sm mb-3">Today's Overview</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border p-3 rounded-xl">
                  <span className="text-[11px] text-emerald-700 font-medium">Total Sales</span>
                  <p className="text-base font-bold text-emerald-900 mt-1">₹2,480</p>
                </div>
                <div className="bg-rose-50 border p-3 rounded-xl">
                  <span className="text-[11px] text-rose-700 font-medium">Pending Udhaar</span>
                  <p className="text-base font-bold text-rose-900 mt-1">₹{totalUdhaarVal}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-50">
        {navigationItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center space-y-1 text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}