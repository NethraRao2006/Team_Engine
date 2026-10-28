import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  AlertOctagon,
  CreditCard,
  CheckCircle2,
  Clock,
  Globe,
} from 'lucide-react';
import { Product, Activity, Customer, ShopProfile } from '../types';
import { normalizeKannadaMessage, hasKannada, speechRecognitionError, customerDocumentId } from '../services/messageParser';
import { store } from '../services/store';

interface ChatTabProps {
  products: Product[];
  activities: Activity[];
  customers: Customer[];
  profile: ShopProfile;
  onNavigateTab: (tab: string) => void;
  onShowToast: (msg: string) => void;
}

export function ChatTab({
  products,
  activities,
  customers,
  profile,
  onNavigateTab,
  onShowToast,
}: ChatTabProps) {
  const [message, setMessage] = useState('');
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'kn-IN'>('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [processing, setProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  // Voice recognition
  const toggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
        // Automatically process after brief preview
        setTimeout(() => {
          handleExecuteMessage(transcript, voiceLang === 'kn-IN' ? 'voice_kannada' : 'voice_english');
        }, 400);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceError(speechRecognitionError(event.error));
        onShowToast(speechRecognitionError(event.error));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      onShowToast(`Microphone error: ${err.message}`);
    }
  };

  const handleExecuteMessage = async (inputMessage: string, channel: 'voice_kannada' | 'voice_english' | 'chat_command' = 'chat_command') => {
    const raw = inputMessage.trim();
    if (!raw) return;

    setProcessing(true);
    try {
      const parsed = normalizeKannadaMessage(raw, products);
      if (hasKannada(parsed) && parsed === raw) {
        throw new Error('Kannada update not recognized. Try "೩ ಮ್ಯಾಗಿ ಮಾರಿದೆ" (sold 3 Maggi) or "ರಮೇಶ್ ೨೦೦ ರೂಪಾಯಿ ಕೊಟ್ಟರು" (Ramesh paid 200).');
      }

      // Check payment match
      const paymentMatch = parsed.match(/^\s*(.+?)\s+(?:paid|payed)\s+(?:₹\s*)?([\d,]+)\s*$/i);
      if (paymentMatch) {
        const customerName = paymentMatch[1].trim();
        const amount = Number(paymentMatch[2].replace(/,/g, ''));
        if (!amount) throw new Error('Specify payment amount, e.g. "Ramesh paid 200"');

        const success = store.recordCustomerPayment(
          customerName,
          amount,
          `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`,
          channel
        );
        if (success) {
          setMessage('');
          onShowToast(`Recorded payment ₹${amount} from ${customerName}.`);
        }
        return;
      }

      // Detect transaction action
      const creditMatch = parsed.match(/^\s*(.+?)\s+took\s+(.+?)\s+(?:on\s+credit|credit)\s*$/i);
      const actionMatch = parsed.match(/\b(sold|sell|sale|received|restocked|damaged|returned|return)\b/i);
      const isCredit = Boolean(creditMatch);

      if (!isCredit && !actionMatch) {
        throw new Error('Action not identified. Try: "sold 3 Maggi", "received 20 rice", or "Ramesh took 2 rice on credit"');
      }

      const actionMap: Record<string, Activity['type']> = {
        sold: 'sold',
        sell: 'sold',
        sale: 'sold',
        received: 'received',
        restocked: 'received',
        damaged: 'damaged',
        returned: 'returned',
        return: 'returned',
      };
      const actionWord = actionMatch ? actionMatch[1].toLowerCase() : '';
      const type: Activity['type'] = isCredit ? 'credit' : (actionMap[actionWord] || 'sold');

      const customerName = creditMatch ? creditMatch[1].trim() : '';
      const details = creditMatch ? creditMatch[2] : parsed.slice((actionMatch?.index || 0) + (actionMatch?.[0]?.length || 0));

      // Match products and quantities
      const candidates = [...products].sort((a, b) => b.name.length - a.name.length);
      const matches: { product: Product; quantity: number }[] = [];
      const pattern = /(\d+)\s+([a-z][a-z -]*?)(?=\s*,\s*|\s+and\s+|$)/gi;

      for (const found of details.matchAll(pattern)) {
        const qty = Number(found[1]);
        const desc = found[2].trim().toLowerCase();
        const matchedProduct = candidates.find(
          (c) => desc.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(desc) || desc.includes(c.id)
        );
        if (matchedProduct && qty > 0) {
          matches.push({ product: matchedProduct, quantity: qty });
        }
      }

      if (!matches.length) {
        throw new Error('Could not match item and quantity. Example: "sold 3 Maggi and 2 milk"');
      }

      // Process product quantity updates & audit diffs
      const responseItems: any[] = [];
      let totalAmount = 0;
      const diffs: any[] = [];

      for (const m of matches) {
        const before = m.product.stock;
        const add = type === 'received' || type === 'returned';
        const after = add ? before + m.quantity : before - m.quantity;

        if (after < 0) {
          throw new Error(`${m.product.name} has only ${before} ${m.product.unit} in stock.`);
        }

        m.product.stock = after;
        store.saveProduct(m.product, `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`);

        const itemTotal = m.quantity * m.product.price;
        totalAmount += itemTotal;

        responseItems.push({
          name: m.product.name,
          quantity: m.quantity,
          before,
          after,
          unit: m.product.unit,
          price: m.product.price,
        });

        diffs.push({
          entity: m.product.name,
          field: 'stock',
          before,
          after,
          unit: m.product.unit,
        });
      }

      let customerBalance: number | undefined;
      if (isCredit) {
        store.addCustomerCredit(
          customerName,
          totalAmount,
          undefined,
          `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`,
          channel
        );
        const updatedCust = store.getCustomers().find((c) => c.name.toLowerCase() === customerName.toLowerCase());
        customerBalance = updatedCust?.balance;
        diffs.push({
          entity: customerName,
          field: 'udhaarBalance',
          before: 'previous',
          after: `₹${customerBalance}`,
        });
      }

      // Create activity record
      const newActivity: Activity = {
        id: 'act-' + Date.now(),
        type,
        message: raw,
        items: responseItems,
        customer: isCredit ? customerName : undefined,
        amount: totalAmount,
        balance: customerBalance,
        createdAt: new Date().toISOString(),
        actor: `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`,
        channel,
      };
      store.addActivity(newActivity);

      // Add to Audit Log
      store.addAuditLog({
        category: isCredit ? 'financial' : 'inventory',
        action: isCredit ? 'UDHAAR_CREDIT_ISSUED' : type === 'sold' ? 'SALE_PROCESSED' : 'STOCK_ADJUSTMENT',
        actor: `${profile.currentRole} (${profile.ownerName.split(' ')[0]})`,
        summary: isCredit
          ? `Credit sale: ${customerName} took items worth ₹${totalAmount.toLocaleString('en-IN')}`
          : `${type.toUpperCase()}: ${responseItems.map((i) => `${i.quantity} ${i.name}`).join(', ')} (₹${totalAmount.toLocaleString('en-IN')})`,
        diffs,
        severity: isCredit ? 'warning' : 'info',
        channel,
        metadata: { rawText: raw, totalAmount, itemCount: responseItems.length },
      });

      setMessage('');
      onShowToast(
        isCredit
          ? `Recorded ₹${totalAmount} credit for ${customerName}!`
          : `Recorded: ${responseItems.map((i) => `${i.name} (${i.before} → ${i.after})`).join(', ')}`
      );
    } catch (err: any) {
      onShowToast(err.message || 'Error processing shop update');
    } finally {
      setProcessing(false);
    }
  };

  const samplePrompts = [
    { text: 'Sold 3 Maggi and 2 milk', icon: '🛒', label: 'Sale' },
    { text: 'Received 20 rice bags', icon: '📥', label: 'Stock' },
    { text: 'Ramesh took 2 rice on credit', icon: '📝', label: 'Credit' },
    { text: 'Ramesh paid ₹200', icon: '💵', label: 'Payment' },
    { text: 'Damaged 1 cooking oil', icon: '⚠️', label: 'Damage' },
  ];

  const kannadaPrompts = [
    { text: '೩ ಮ್ಯಾಗಿ ಮತ್ತು ೨ ಹಾಲು ಮಾರಿದೆ', icon: '🛒', label: 'ಮಾರಾಟ' },
    { text: '೨೦ ಅಕ್ಕಿ ಚೀಲ ಬಂದಿದೆ', icon: '📥', label: 'ಸ್ಟಾಕ್' },
    { text: 'ರಮೇಶ್ ೨೦೦ ರೂಪಾಯಿ ಕೊಟ್ಟರು', icon: '💵', label: 'ಪಾವತಿ' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/60 overflow-hidden">
      {/* Banner / Mode helper */}
      <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sparkles size={14} className="text-indigo-400" />
          <span className="font-medium">Voice & Quick Entry Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVoiceLang(voiceLang === 'en-IN' ? 'kn-IN' : 'en-IN')}
            className="flex items-center gap-1 text-[11px] font-semibold bg-slate-700/80 hover:bg-slate-700 px-2 py-0.5 rounded text-indigo-300 border border-slate-600/60"
            title="Toggle between English and Kannada speech recognition"
          >
            <Globe size={11} />
            <span>{voiceLang === 'kn-IN' ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}</span>
          </button>
        </div>
      </div>

      {/* Activities Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200">Shop Counter Assistant</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              Speak or type what happened in your shop. Stock and customer credit balances update in real time!
            </p>
          </div>
        ) : (
          activities.map((act) => {
            const isSale = act.type === 'sold';
            const isCredit = act.type === 'credit';
            const isPayment = act.type === 'payment';
            const isReceived = act.type === 'received';
            const isDamaged = act.type === 'damaged';

            return (
              <div
                key={act.id}
                className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 shadow-sm text-xs space-y-2 hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isSale
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isCredit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isPayment
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : isReceived
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {act.type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(act.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium">{act.actor || 'Owner'}</span>
                </div>

                <p className="text-slate-100 font-medium text-xs leading-relaxed">{act.message}</p>

                {/* Items breakdown pills */}
                {act.items && act.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {act.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-900/90 border border-slate-700/50 rounded-lg px-2 py-0.5 text-[11px] text-slate-300"
                      >
                        {item.name}: <strong className="text-white">{item.quantity} {item.unit}</strong>
                        {item.price > 0 && <span className="text-slate-400 ml-1">(@ ₹{item.price})</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Amount / balance info */}
                {(act.amount !== undefined || act.balance !== undefined) && (
                  <div className="flex items-center justify-between border-t border-slate-700/40 pt-1.5 text-[11px] text-slate-300 font-medium">
                    {act.amount !== undefined && (
                      <span>Amount: <strong className="text-emerald-400">₹{act.amount.toLocaleString('en-IN')}</strong></span>
                    )}
                    {act.balance !== undefined && (
                      <span>Balance: <strong className="text-amber-400">₹{act.balance.toLocaleString('en-IN')}</strong></span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(voiceLang === 'kn-IN' ? kannadaPrompts : samplePrompts).map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setMessage(chip.text)}
              className="flex-shrink-0 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 px-2.5 py-1 rounded-full text-[11px] border border-slate-700/70 transition"
            >
              <span>{chip.icon}</span>
              <span>{chip.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteMessage(message);
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700'
            }`}
            title={isListening ? 'Stop listening' : `Tap to speak in ${voiceLang === 'kn-IN' ? 'Kannada' : 'English'}`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isListening
                  ? `Listening in ${voiceLang === 'kn-IN' ? 'Kannada' : 'English'}...`
                  : 'e.g. sold 3 Maggi or Ramesh paid 200'
              }
              className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || processing}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition active:scale-95 flex-shrink-0 shadow-md shadow-indigo-600/30"
            title="Record transaction"
          >
            <Send size={18} />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
          <span>Speak naturally in English or Kannada</span>
          <span>Updates Stock & Udhaar instantly</span>
        </div>
      </div>
    </div>
  );
}
