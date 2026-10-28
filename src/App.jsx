import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownLeft, ArrowRight, BarChart3,
  Bell, Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardList, CreditCard,
  IndianRupee, LogOut, MessageCircle, Mic, MicOff, Package,
  Plus, Send, Settings, ShoppingBag, Sparkles, Store, TrendingUp, Users, Wallet, X,
} from "lucide-react";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signOut, updateProfile,
} from "firebase/auth";
import {
  collection, doc, onSnapshot, runTransaction, serverTimestamp, setDoc, writeBatch,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { customerDocumentId, hasKannada, normalizeKannadaMessage, speechRecognitionError } from "./messageParser";

const starterProducts = [
  { id: "maggi", name: "Maggi", stock: 40, minStock: 10, unit: "packets", price: 14, color: "orange" },
  { id: "milk", name: "Milk", stock: 12, minStock: 8, unit: "packets", price: 28, color: "blue" },
  { id: "rice", name: "Rice", stock: 30, minStock: 10, unit: "bags", price: 500, color: "green" },
  { id: "oil", name: "Cooking Oil", stock: 2, minStock: 5, unit: "bottles", price: 160, color: "yellow" },
  { id: "biscuits", name: "Biscuits", stock: 3, minStock: 10, unit: "packets", price: 10, color: "pink" },
  { id: "sugar", name: "Sugar", stock: 5, minStock: 8, unit: "kg", price: 45, color: "purple" },
  { id: "atta", name: "Wheat Atta", stock: 18, minStock: 6, unit: "kg", price: 42, color: "yellow" },
  { id: "toor-dal", name: "Toor Dal", stock: 14, minStock: 5, unit: "kg", price: 150, color: "orange" },
  { id: "chana-dal", name: "Chana Dal", stock: 12, minStock: 5, unit: "kg", price: 90, color: "yellow" },
  { id: "salt", name: "Salt", stock: 24, minStock: 8, unit: "packets", price: 22, color: "blue" },
  { id: "tea", name: "Tea Powder", stock: 16, minStock: 5, unit: "packets", price: 120, color: "green" },
  { id: "coffee", name: "Coffee", stock: 10, minStock: 4, unit: "packets", price: 110, color: "purple" },
  { id: "soap", name: "Bath Soap", stock: 20, minStock: 6, unit: "bars", price: 35, color: "pink" },
  { id: "shampoo", name: "Shampoo", stock: 15, minStock: 5, unit: "sachets", price: 2, color: "purple" },
  { id: "toothpaste", name: "Toothpaste", stock: 9, minStock: 4, unit: "tubes", price: 55, color: "blue" },
  { id: "detergent", name: "Detergent", stock: 13, minStock: 5, unit: "packets", price: 65, color: "green" },
  { id: "bread", name: "Bread", stock: 8, minStock: 3, unit: "loaves", price: 40, color: "yellow" },
  { id: "eggs", name: "Eggs", stock: 30, minStock: 12, unit: "eggs", price: 7, color: "orange" },
  { id: "noodles", name: "Noodles", stock: 17, minStock: 6, unit: "packets", price: 14, color: "pink" },
  { id: "ghee", name: "Ghee", stock: 7, minStock: 3, unit: "jars", price: 320, color: "yellow" },
  { id: "turmeric", name: "Turmeric Powder", stock: 11, minStock: 4, unit: "packets", price: 38, color: "orange" },
  { id: "chilli-powder", name: "Chilli Powder", stock: 9, minStock: 4, unit: "packets", price: 42, color: "pink" },
  { id: "onion", name: "Onions", stock: 20, minStock: 8, unit: "kg", price: 35, color: "purple" },
  { id: "potato", name: "Potatoes", stock: 22, minStock: 8, unit: "kg", price: 30, color: "yellow" },
  { id: "water", name: "Water Bottle", stock: 18, minStock: 6, unit: "bottles", price: 20, color: "blue" },
];

const navItems = [
  { id: "Chat", icon: MessageCircle },
  { id: "Inventory", icon: Package },
  { id: "Sales & Reports", icon: BarChart3 },
  { id: "Customers (Udhaar)", icon: Users },
  { id: "Reorder Suggestions", icon: ShoppingBag },
  { id: "Daily Summary", icon: ClipboardList },
  { id: "Settings", icon: Settings },
];

const dateLabel = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : new Date();
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};

const dayKey = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const rupees = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function readableAuthError(error) {
  const messages = {
    "auth/invalid-credential": "Email or password is incorrect. If this is your first time, choose “Create an owner account” first.",
    "auth/user-not-found": "No owner account exists for this email yet. Choose “Create an owner account”.",
    "auth/wrong-password": "That password is incorrect. Please try again.",
    "auth/email-already-in-use": "This email already has an account. Choose “Sign in” instead.",
    "auth/operation-not-allowed": "Email/Password sign-in is disabled. Enable it under Firebase Console → Authentication → Sign-in method.",
    "auth/unauthorized-domain": "This website domain is not authorized. Add it under Firebase Console → Authentication → Settings → Authorized domains.",
    "auth/invalid-api-key": "Firebase rejected the API key. Check the Firebase values in .env.local, then restart the dev server.",
    "auth/network-request-failed": "Could not reach Firebase. Check your internet connection and try again.",
    "auth/too-many-requests": "Too many sign-in attempts. Wait a little and try again.",
  };
  return messages[error.code] || `${error.message || "Unable to sign in. Please try again."}${error.code ? ` (${error.code})` : ""}`;
}

function ProductGlyph({ color = "blue" }) {
  return <span className={`product-glyph ${color}`}><Package size={17} strokeWidth={2} /></span>;
}

function inventoryFailure(error) {
  if (error.code === "permission-denied") {
    return "Firestore denied inventory access. Publish the owner-only rules for Firebase project vyapaari-b27da, then retry.";
  }
  return `Could not load inventory: ${error.message}`;
}

function LoginPage() {
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (signup) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (issue) {
      setError(readableAuthError(issue));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-brand"><span className="brand-mark"><Store size={23} /></span><span><b>KiranaShop</b><small>ASSISTANT</small></span></div>
      <section className="login-card">
        <div className="login-icon"><Sparkles size={21} /></div>
        <p className="eyebrow">YOUR SHOP, IN GOOD HANDS</p>
        <h1>{signup ? "Create your owner account" : "Welcome back"}</h1>
        <p className="login-subtitle">A simpler way to keep your kirana shop in sync.</p>
        <form onSubmit={submit} className="login-form">
          {signup && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ramesh Sharma" required /></label>}
          <label>Email address<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@yourshop.in" required /></label>
          <label>Password<input autoComplete={signup ? "new-password" : "current-password"} type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" required /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button login-submit" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}<ArrowRight size={17} /></button>
        </form>
        <p className="login-switch">{signup ? "Already have an account?" : "New to KiranaShop?"} <button onClick={() => { setSignup(!signup); setError(""); }}>{signup ? "Sign in" : "Create an owner account"}</button></p>
        <div className="secure-note"><CheckCircle2 size={15} /> Your shop data is private to your account</div>
      </section>
      <p className="login-footer">Simple · Smart · For Kirana Shops</p>
    </main>
  );
}

function AssistantReply({ activity }) {
  const type = activity.type;
  const credit = type === "credit";
  const payment = type === "payment";
  const damage = type === "damaged";
  const received = type === "received" || type === "returned";
  const title = credit ? "Credit transaction recorded!" : payment ? "Payment recorded!" : damage ? "Damaged stock recorded." : received ? "New stock added!" : "Stock updated successfully!";
  return (
    <div className="assistant-reply">
      <div className="reply-title"><span className={`reply-status ${damage ? "warning" : ""}`}>{damage ? <AlertTriangle size={15} /> : <Check size={15} />}</span><b>{title}</b></div>
      {activity.items?.map((item, index) => (
        <div className="reply-line" key={`${item.name}-${index}`}><span>{item.name}: {item.before} → {item.after}</span><small>{type} {item.quantity}</small></div>
      ))}
      {credit && <div className="credit-reply"><span>Customer</span><b>{activity.customer}</b><span>Credit added</span><b>{rupees(activity.amount)}</b><span>Item</span><b>{activity.items?.map((item) => `${item.name} (${item.quantity})`).join(", ")}</b><span>Outstanding balance</span><b>{rupees(activity.balance)}</b></div>}
      {payment && <p className="reply-note">{activity.customer} paid {rupees(activity.amount)}. Balance: {rupees(activity.balance)}.</p>}
      {activity.message && !activity.items?.length && <p className="reply-note">{activity.message}</p>}
      <p className="reply-note">{credit || payment ? "Customer account updated." : damage ? "Stock count adjusted." : "Anything else you'd like to update?"}</p>
    </div>
  );
}

function ActivityMessage({ activity }) {
  return (
    <div className="conversation-pair">
      <div className="message-row owner-row"><div><div className="owner-bubble">{activity.message}</div><span className="message-time">{dateLabel(activity.createdAt)}</span></div></div>
      <div className="message-row assistant-row"><div className="assistant-avatar"><Sparkles size={15} /></div><div><AssistantReply activity={activity} /><span className="message-time">{dateLabel(activity.createdAt)}</span></div></div>
    </div>
  );
}

function ChatView({ user, products, activities, onSend, busy, onReorder, inventoryStatus, inventoryError, onRetryInventory }) {
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("en-IN");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const recent = [...activities].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 20).reverse();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [recent.length]);

  async function submit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    const result = await onSend(text);
    if (result) setMessage("");
  }

  function toggleVoice() {
    setVoiceError("");
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("This browser does not support voice input. Try the latest Chrome or Edge, or type your message instead.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = voiceLanguage;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        let transcript = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) transcript += event.results[index][0].transcript;
        setMessage(transcript);
      };
      recognition.onerror = (event) => { setVoiceError(speechRecognitionError(event.error)); setListening(false); };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (error) {
      setVoiceError(error.message || "Could not start voice input. Check microphone permission and try again.");
      setListening(false);
    }
  }

  return (
    <section className="chat-card">
      <div className="chat-card-head"><div><span className={`live-dot ${inventoryStatus !== "ready" ? "offline" : ""}`} />Shop assistant <span className="chat-online">{inventoryStatus === "ready" ? "Ready to help" : inventoryStatus === "loading" ? "Connecting to inventory…" : "Needs attention"}</span></div><button className="icon-button" title="Chat examples" onClick={() => setVoiceError("English: “sold 3 Maggi and 2 milk”. Kannada: “3 ಮ್ಯಾಗಿ ಮಾರಿದೆ” (sold 3 Maggi), “20 ಅಕ್ಕಿ ಚೀಲ ಬಂದಿದೆ” (received 20 rice bags), “ರಮೇಶ್ 2 ಅಕ್ಕಿ ಸಾಲವಾಗಿ ತೆಗೆದುಕೊಂಡರು” (Ramesh took 2 rice on credit), “ರಮೇಶ್ 200 ರೂಪಾಯಿ ಕೊಟ್ಟರು” (Ramesh paid ₹200).")}><CircleHelp size={18} /></button></div>
      {inventoryStatus === "error" && <div className="connection-banner"><AlertTriangle size={17} /><div><b>Chat is waiting for your inventory</b><span>{inventoryError}</span><a href="https://console.firebase.google.com/project/vyapaari-b27da/firestore/databases/-default-/rules" target="_blank" rel="noreferrer">Open this project’s Firestore rules <ArrowRight size={13} /></a></div><button onClick={onRetryInventory}>Retry</button></div>}
      <div className="conversation">
        {!recent.length && <div className="welcome-message"><div className="welcome-icon"><Sparkles size={20} /></div><h2>Namaste{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}! What happened in your shop today?</h2><p>Tell me naturally and I’ll update your stock and records. Try one of these:</p><div className="prompt-chips">{["Sold 3 Maggi and 2 milk", "Received 20 rice bags", "Ramesh took 2 rice on credit"].map((item) => <button key={item} onClick={() => setMessage(item)}>{item}<ArrowRight size={13} /></button>)}</div></div>}
        {recent.map((activity) => <ActivityMessage key={activity.id} activity={activity} />)}
        <div ref={chatEndRef} />
      </div>
      <div className="composer-wrap">
        <form className="composer" onSubmit={submit}>
          <textarea aria-label="Message" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} placeholder="Type a message or tap the mic..." rows="1" />
          <select className="voice-language" aria-label="Voice language" value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)} title="Voice language"><option value="en-IN">EN</option><option value="kn-IN">ಕನ್ನಡ</option></select>
          <button type="button" className={`mic-button ${listening ? "listening" : ""}`} onClick={toggleVoice} title={listening ? "Stop voice input" : "Start voice input"}>{listening ? <MicOff size={19} /> : <Mic size={19} />}</button>
          <button type="submit" className="send-button" disabled={!message.trim() || busy || inventoryStatus !== "ready"} title={inventoryStatus === "ready" ? "Send message" : "Inventory is not ready"}>{busy ? <span className="spinner" /> : <Send size={18} />}</button>
        </form>
        <div className="composer-foot"><span>{inventoryStatus === "error" ? <>{inventoryError} <button className="retry-button" onClick={onRetryInventory}>Retry</button></> : inventoryStatus === "loading" ? "Loading your saved inventory…" : voiceError || (listening ? `Listening in ${voiceLanguage === "kn-IN" ? "Kannada" : "English"}… speak now` : "Type or speak in English, Kannada, or a mix of both")}</span><span>Enter to send · <kbd>Shift + Enter</kbd> for a new line</span></div>
      </div>
    </section>
  );
}

function Overview({ activities, customers }) {
  const today = activities.filter((activity) => dayKey(activity.createdAt) === dayKey());
  const sales = today.filter((activity) => ["sold", "credit"].includes(activity.type));
  const itemsSold = sales.reduce((sum, activity) => sum + (activity.items || []).reduce((count, item) => count + item.quantity, 0), 0);
  const totalSales = sales.reduce((sum, activity) => sum + Number(activity.amount || (activity.items || []).reduce((total, item) => total + item.quantity * (item.price || 0), 0)), 0);
  const received = today.filter((activity) => ["received", "returned"].includes(activity.type)).reduce((sum, activity) => sum + (activity.items || []).reduce((count, item) => count + item.quantity, 0), 0);
  const udhaar = customers.reduce((sum, customer) => sum + Number(customer.balance || 0), 0);
  const metrics = [
    { title: "Total sales", value: rupees(totalSales), label: "Today", icon: IndianRupee, color: "green" },
    { title: "Items sold", value: itemsSold, label: "Today", icon: TrendingUp, color: "blue" },
    { title: "Stock received", value: received, label: "Today", icon: ArrowDownLeft, color: "orange" },
    { title: "Pending udhaar", value: rupees(udhaar), label: "Outstanding", icon: Wallet, color: "pink" },
  ];
  return <div className="metric-grid">{metrics.map(({ title, value, label, icon: Icon, color }) => <article className={`metric-card ${color}`} key={title}><span className="metric-icon"><Icon size={16} /></span><small>{title}</small><strong>{value}</strong><span className="metric-label">{label}</span></article>)}</div>;
}

function SidePanel({ products, activities, customers, onReorder, onNavigate }) {
  const lowStock = products.filter((product) => product.stock <= product.minStock);
  const recent = [...activities].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 3);
  const typeLabel = { sold: "Sale", received: "Stock", returned: "Return", damaged: "Damaged", credit: "Credit", payment: "Payment" };
  return (
    <aside className="info-panel">
      <section className="panel-card overview-card"><div className="section-title"><div><h2>Today’s overview</h2><span className="today-label">Your shop at a glance</span></div><span className="date-chip">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div><Overview activities={activities} customers={customers} /></section>
      <section className="panel-card"><div className="section-title"><div><h2>Low stock alerts</h2><span className="today-label">{lowStock.length} items need attention</span></div><button className="text-button" onClick={() => onNavigate("Reorder Suggestions")}>View all</button></div>
        {lowStock.length ? <div className="low-stock-list">{lowStock.slice(0, 4).map((product) => <div className="low-stock-row" key={product.id}><ProductGlyph color={product.color} /><div className="low-stock-name"><b>{product.name}</b><span><i />{product.stock} {product.unit} left</span></div><button className="reorder-mini" onClick={() => onReorder([product])}>Reorder <ArrowRight size={12} /></button></div>)}</div> : <p className="empty-note">All stocked up. No reorder alerts.</p>}
      </section>
      <section className="panel-card"><div className="section-title"><div><h2>Recent activity</h2><span className="today-label">Latest shop updates</span></div><button className="text-button" onClick={() => onNavigate("Sales & Reports")}>View all</button></div>
        {recent.length ? <div className="activity-list">{recent.map((activity) => <div className="activity-row" key={activity.id}><span className={`activity-icon ${activity.type}`}><Activity size={15} /></span><div className="activity-text"><b>{activity.message}</b><span>{typeLabel[activity.type] || "Update"} · {dateLabel(activity.createdAt)}</span></div></div>)}</div> : <p className="empty-note">Your recorded transactions will appear here.</p>}
      </section>
      <button className="supplier-card" onClick={() => onReorder(lowStock)}><span className="whatsapp-icon"><MessageCircle size={19} /></span><span><b>Send reorder message</b><small>Generate supplier message</small></span><ArrowRight size={17} /></button>
    </aside>
  );
}

function Sidebar({ active, onNavigate, user, onSignOut, shopName }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark"><Store size={22} /></span><span className="brand-copy"><b>KiranaShop</b><small>ASSISTANT</small></span></div>
    <div className="nav-caption">WORKSPACE</div>
    <nav>{navItems.map(({ id, icon: Icon }) => <button className={`nav-item ${active === id ? "active" : ""}`} key={id} onClick={() => onNavigate(id)}><Icon size={18} strokeWidth={1.9} /><span>{id}</span>{id === "Reorder Suggestions" && <span className="nav-dot" />}</button>)}</nav>
    <div className="sidebar-bottom">
      <button className={`shop-profile ${profileOpen ? "open" : ""}`} onClick={() => setProfileOpen(!profileOpen)}><span className="shop-avatar"><Store size={18} /></span><span className="shop-info"><b>{shopName || "Sharma General Store"}</b><small>Owner · {user.email}</small></span><ChevronDown size={16} className="profile-chevron" /></button>
      {profileOpen && <button className="signout-button" onClick={onSignOut}><LogOut size={15} /> Sign out</button>}
      <div className="sidebar-tagline"><span>Simple · Smart · For Kirana Shops</span></div>
    </div>
  </aside>;
}

function PageContent({ page, products, activities, customers, onUpdateMinStock, onReorder, shopName, setShopName, onAddCredit, onRecordPayment }) {
  const [shopNameDraft, setShopNameDraft] = useState(shopName);
  const [customerName, setCustomerName] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [savingCredit, setSavingCredit] = useState(false);
  const [savingPayment, setSavingPayment] = useState("");
  const totalCustomerBalance = customers.reduce((total, customer) => total + Number(customer.balance || 0), 0);
  useEffect(() => setShopNameDraft(shopName), [shopName]);
  if (page === "Inventory") return <section className="page-card"><div className="page-heading"><span className="page-icon blue"><Package size={20} /></span><div><h2>Your inventory</h2><p>Current stock and reorder levels for every item.</p></div></div><div className="table-wrap"><table><thead><tr><th>Product</th><th>In stock</th><th>Minimum level</th><th>Status</th><th></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><ProductGlyph color={product.color} /><b>{product.name}</b></div></td><td>{product.stock} {product.unit}</td><td><input className="min-stock-input" type="number" min="0" defaultValue={product.minStock} aria-label={`${product.name} minimum stock`} onBlur={(event) => { const value = Number(event.currentTarget.value); if (Number.isInteger(value) && value >= 0) onUpdateMinStock(product, value); else event.currentTarget.value = String(product.minStock); }} /></td><td><span className={`status-pill ${product.stock <= product.minStock ? "low" : "good"}`}>{product.stock <= product.minStock ? "Reorder soon" : "In stock"}</span></td><td>{product.stock <= product.minStock && <button className="table-reorder" onClick={() => onReorder([product])}>Reorder</button>}</td></tr>)}</tbody></table></div><p className="inline-hint">Change a minimum level and leave the field to save. Stock counts change through chat transactions.</p></section>;
  if (page === "Sales & Reports") {
    const ordered = [...activities].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return <section className="page-card"><div className="page-heading"><span className="page-icon purple"><BarChart3 size={20} /></span><div><h2>Sales & reports</h2><p>Your recorded stock movements and customer transactions.</p></div></div>{ordered.length ? <div className="report-list">{ordered.map((item) => <div className="report-row" key={item.id}><span className={`activity-icon ${item.type}`}><Activity size={15} /></span><div><b>{item.message}</b><small>{typeName(item.type)} · {dateLabel(item.createdAt)}</small></div><strong>{item.amount ? rupees(item.amount) : `${item.items?.length || 0} items`}</strong></div>)}</div> : <div className="empty-state"><BarChart3 size={27} /><b>No transactions yet</b><span>Send your first stock update in Chat to see it here.</span></div>}</section>;
  }
  if (page === "Customers (Udhaar)") return <section className="page-card"><div className="page-heading"><span className="page-icon pink"><Users size={20} /></span><div><h2>Customers & udhaar</h2><p>Add credit or record payments to keep each customer’s remaining balance up to date.</p></div></div>
    <form className="credit-entry-form" onSubmit={async (event) => {
      event.preventDefault();
      if (savingCredit) return;
      setSavingCredit(true);
      const saved = await onAddCredit(customerName, creditAmount);
      if (saved) { setCustomerName(""); setCreditAmount(""); }
      setSavingCredit(false);
    }}>
      <div className="credit-form-heading"><span className="credit-form-icon"><Plus size={17} /></span><span><b>Add customer credit</b><small>Adding credit for an existing customer increases their balance</small></span></div>
      <div className="credit-form-fields"><label>Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="e.g. Ramesh" required /></label><label>Credit amount<input type="number" min="0.01" step="0.01" value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} placeholder="₹ Amount" required /></label><button className="primary-button" type="submit" disabled={savingCredit}>{savingCredit ? "Saving…" : "Add credit"}<ArrowRight size={15} /></button></div>
    </form>
    <div className="customer-list-heading"><h3>Customer balances</h3><span>{customers.length} {customers.length === 1 ? "customer" : "customers"} · {rupees(totalCustomerBalance)} outstanding</span></div>
    {customers.length ? <div className="customer-list">{[...customers].sort((a, b) => (b.balance || 0) - (a.balance || 0)).map((customer) => <div className="customer-row" key={customer.id}><span className="customer-avatar">{customer.name?.[0]?.toUpperCase() || "?"}</span><div className="customer-details"><b>{customer.name}</b><small>Remaining to be paid</small></div><strong className={customer.balance > 0 ? "" : "settled-balance"}>{rupees(customer.balance)}</strong><form className="payment-inline-form" onSubmit={async (event) => {
      event.preventDefault();
      const amount = paymentAmounts[customer.id] || "";
      setSavingPayment(customer.id);
      const saved = await onRecordPayment(customer.name, amount);
      if (saved) setPaymentAmounts((current) => ({ ...current, [customer.id]: "" }));
      setSavingPayment("");
    }}><input aria-label={`Payment from ${customer.name}`} type="number" min="0.01" step="0.01" max={customer.balance} value={paymentAmounts[customer.id] || ""} onChange={(event) => setPaymentAmounts((current) => ({ ...current, [customer.id]: event.target.value }))} placeholder="₹ Paid" disabled={!customer.balance || savingPayment === customer.id} required /><button type="submit" disabled={!customer.balance || !paymentAmounts[customer.id] || savingPayment === customer.id}>{savingPayment === customer.id ? "Saving…" : "Record payment"}</button></form></div>)}</div> : <div className="empty-state"><CreditCard size={27} /><b>No customer balances yet</b><span>Add credit above or record “Ramesh took 2 rice on credit” in Chat.</span></div>}
  </section>;
  if (page === "Reorder Suggestions") {
    const low = products.filter((product) => product.stock <= product.minStock);
    return <section className="page-card"><div className="page-heading"><span className="page-icon orange"><ShoppingBag size={20} /></span><div><h2>Reorder suggestions</h2><p>Products at or below their minimum stock level.</p></div></div>{low.length ? <><div className="suggestion-list">{low.map((product) => <div className="suggestion-row" key={product.id}><ProductGlyph color={product.color} /><div><b>{product.name}</b><small>{product.stock} {product.unit} left · minimum {product.minStock}</small></div><span className="status-pill low">Low stock</span></div>)}</div><button className="primary-button send-reorder" onClick={() => onReorder(low)}><MessageCircle size={17} /> Create WhatsApp reorder message <ArrowRight size={16} /></button></> : <div className="empty-state"><CheckCircle2 size={27} /><b>You’re all stocked up</b><span>There are no items to reorder right now.</span></div>}</section>;
  }
  if (page === "Daily Summary") {
    const today = activities.filter((activity) => dayKey(activity.createdAt) === dayKey());
    const total = today.reduce((sum, activity) => sum + (activity.items || []).reduce((count, item) => count + item.quantity, 0), 0);
    return <section className="page-card"><div className="page-heading"><span className="page-icon green"><ClipboardList size={20} /></span><div><h2>Daily summary</h2><p>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p></div></div><div className="summary-stats"><div><small>Transactions today</small><b>{today.length}</b></div><div><small>Units moved</small><b>{total}</b></div><div><small>Products tracked</small><b>{products.length}</b></div></div><h3 className="subheading">Current stock overview</h3><div className="summary-stock">{products.map((product) => <div key={product.id}><span>{product.name}</span><b>{product.stock} {product.unit}</b></div>)}</div><h3 className="subheading">Today’s activity</h3>{today.length ? <div className="report-list">{today.map((item) => <div className="report-row" key={item.id}><span className={`activity-icon ${item.type}`}><Activity size={15} /></span><div><b>{item.message}</b><small>{dateLabel(item.createdAt)}</small></div></div>)}</div> : <p className="empty-note">No transactions recorded today yet.</p>}</section>;
  }
  if (page === "Settings") return <section className="page-card"><div className="page-heading"><span className="page-icon blue"><Settings size={20} /></span><div><h2>Shop settings</h2><p>Personalize your workspace.</p></div></div><label className="settings-label">Shop name<input value={shopNameDraft} onChange={(event) => setShopNameDraft(event.target.value)} placeholder="Your shop name" /></label><button className="primary-button settings-save" onClick={() => setShopName(shopNameDraft.trim() || "My Kirana Shop")}>Save shop name</button><div className="settings-note"><CheckCircle2 size={17} /><span>Your inventory and customer records are private to your signed-in account.</span></div></section>;
  return null;
}

function typeName(type) {
  return ({ sold: "Sale", received: "Stock received", returned: "Customer return", damaged: "Damaged stock", credit: "Udhaar", payment: "Payment" })[type] || "Stock update";
}

function Dashboard({ user }) {
  const [page, setPage] = useState("Chat");
  const [products, setProducts] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState("loading");
  const [inventoryError, setInventoryError] = useState("");
  const [inventoryRetry, setInventoryRetry] = useState(0);
  const [activities, setActivities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [shopName, setShopNameState] = useState("Sharma General Store");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileInitial, setProfileInitial] = useState("R");
  const toastTimer = useRef(null);
  const productsCollection = useMemo(() => collection(db, "users", user.uid, "products"), [user.uid]);

  useEffect(() => {
    setInventoryStatus("loading");
    setInventoryError("");
    const stopProducts = onSnapshot(productsCollection, async (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          starterProducts.forEach((product) => batch.set(doc(productsCollection, product.id), product, { merge: true }));
          await batch.commit();
        } catch (error) {
          const message = error.code === "permission-denied"
            ? "Firestore denied inventory setup. Publish the owner-only rules for Firebase project vyapaari-b27da, then retry."
            : `Could not initialize inventory: ${error.message}`;
          setInventoryError(message);
          setInventoryStatus("error");
          showToast(message);
        }
        return;
      }
      const savedProducts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      setProducts(savedProducts);
      setInventoryStatus("ready");
      const existingIds = new Set(snapshot.docs.map((item) => item.id));
      const missingProducts = starterProducts.filter((product) => !existingIds.has(product.id));
      if (missingProducts.length) {
        const batch = writeBatch(db);
        missingProducts.forEach((product) => batch.set(doc(productsCollection, product.id), product, { merge: true }));
        batch.commit().catch((error) => showToast(`Could not finish setting up starter products: ${error.message}`));
      }
    }, (error) => {
      const message = inventoryFailure(error);
      setInventoryError(message);
      setInventoryStatus("error");
      showToast(message);
    });
    const stopActivities = onSnapshot(collection(db, "users", user.uid, "activities"), (snapshot) => setActivities(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), (error) => showToast(error.message));
    const stopCustomers = onSnapshot(collection(db, "users", user.uid, "customers"), (snapshot) => setCustomers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), (error) => showToast(error.message));
    const stopProfile = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.shopName) setShopNameState(data.shopName);
      } else setDoc(doc(db, "users", user.uid), { shopName: user.displayName ? `${user.displayName}'s Store` : "Sharma General Store", email: user.email }, { merge: true }).catch((error) => showToast(error.message));
    }, (error) => showToast(error.message));
    return () => { stopProducts(); stopActivities(); stopCustomers(); stopProfile(); };
  }, [user.uid, inventoryRetry]);

  useEffect(() => {
    const initial = user.displayName?.[0] || user.email?.[0] || "R";
    setProfileInitial(initial.toUpperCase());
  }, [user]);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 6000);
  }

  function setShopName(name) {
    setShopNameState(name);
    setDoc(doc(db, "users", user.uid), { shopName: name }, { merge: true }).catch((error) => showToast(`Could not save shop name: ${error.message}`));
  }

  async function updateMinimum(product, minimum) {
    try { await setDoc(doc(productsCollection, product.id), { minStock: minimum }, { merge: true }); }
    catch (error) { showToast(`Could not update reorder level: ${error.message}`); }
  }

  async function addCustomerCredit(name, rawAmount) {
    const customerName = name.trim();
    const amount = Number(rawAmount);
    if (!customerName || !Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a customer name and a credit amount greater than zero.");
      return false;
    }
    const customerId = customerDocumentId(customerName);
    if (!customerId) {
      showToast("Use a customer name with at least one English letter or number.");
      return false;
    }
    const customerRef = doc(db, "users", user.uid, "customers", customerId);
    const activityRef = doc(collection(db, "users", user.uid, "activities"));
    try {
      let balance = 0;
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(customerRef);
        balance = Number(snapshot.data()?.balance || 0) + amount;
        transaction.set(customerRef, { name: snapshot.data()?.name || customerName, balance, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(activityRef, {
          type: "credit",
          message: `Added ${rupees(amount)} credit for ${customerName}`,
          customer: customerName,
          amount,
          balance,
          items: [],
          createdAt: serverTimestamp(),
        });
      });
      showToast(`Added ${rupees(amount)} credit for ${customerName}. Remaining balance: ${rupees(balance)}.`);
      return true;
    } catch (error) {
      showToast(`Could not add customer credit: ${error.message}`);
      return false;
    }
  }

  async function recordCustomerPayment(name, rawAmount) {
    const customerName = name.trim();
    const amount = Number(rawAmount);
    if (!customerName || !Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a payment amount greater than zero.");
      return false;
    }
    const customerId = customerDocumentId(customerName);
    const customerRef = doc(db, "users", user.uid, "customers", customerId);
    const activityRef = doc(collection(db, "users", user.uid, "activities"));
    try {
      let balance = 0;
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(customerRef);
        if (!snapshot.exists()) throw new Error(`No udhaar account found for ${customerName}.`);
        const currentBalance = Number(snapshot.data().balance || 0);
        if (amount > currentBalance) {
          throw new Error(`Payment ${rupees(amount)} is greater than ${customerName}’s remaining balance of ${rupees(currentBalance)}.`);
        }
        balance = currentBalance - amount;
        transaction.set(customerRef, { name: snapshot.data().name || customerName, balance, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(activityRef, {
          type: "payment",
          message: `${customerName} paid ${rupees(amount)}`,
          customer: customerName,
          amount,
          balance,
          items: [],
          createdAt: serverTimestamp(),
        });
      });
      showToast(`Payment of ${rupees(amount)} recorded. ${customerName} has ${rupees(balance)} remaining.`);
      return true;
    } catch (error) {
      showToast(`Could not record payment: ${error.message}`);
      return false;
    }
  }

  function makeReorder(items) {
    if (!items.length) { showToast("No low-stock products to reorder right now."); return; }
    const message = `Namaste, please send these items for ${shopName} today:\n${items.map((item) => `• ${item.name}: ${Math.max(item.minStock * 2 - item.stock, item.minStock)} ${item.unit}`).join("\n")}\nThank you.`;
    const phone = import.meta.env.VITE_SUPPLIER_PHONE?.replace(/\D/g, "");
    const url = `https://wa.me/${phone || ""}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function sendMessage(message) {
    if (inventoryStatus !== "ready" || !products.length) {
      showToast(inventoryStatus === "error" ? inventoryError : "Inventory is still loading. Please try again in a moment.");
      return false;
    }
    setBusy(true);
    try {
      const originalMessage = message;
      const parsedMessage = normalizeKannadaMessage(message, products);
      if (hasKannada(parsedMessage) && parsedMessage === message) {
        throw new Error("I couldn’t understand that Kannada shop update. Try a short phrase such as “3 ಮ್ಯಾಗಿ ಮಾರಿದೆ” (sold 3 Maggi), “20 ಅಕ್ಕಿ ಚೀಲ ಬಂದಿದೆ” (received 20 rice bags), or “ರಮೇಶ್ 200 ರೂಪಾಯಿ ಕೊಟ್ಟರು” (Ramesh paid ₹200).");
      }
      const lower = parsedMessage.toLowerCase();
      const paymentMatch = parsedMessage.match(/^\s*(.+?)\s+(?:paid|payed)\s+(?:₹\s*)?([\d,]+)\s*$/i);
      if (paymentMatch) {
        const customerName = paymentMatch[1].trim();
        const amount = Number(paymentMatch[2].replace(/,/g, ""));
        if (!amount) throw new Error("Please include a payment amount, for example “Ramesh paid ₹200”.");
        const customerId = customerDocumentId(customerName);
        if (!customerId) throw new Error("I couldn’t identify that customer. Please say their name before the payment amount.");
        const customerRef = doc(db, "users", user.uid, "customers", customerId);
        const activityRef = doc(collection(db, "users", user.uid, "activities"));
        let balance = 0;
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(customerRef);
          if (!snapshot.exists()) throw new Error(`No udhaar account found for ${customerName}.`);
          const currentBalance = Number(snapshot.data().balance || 0);
          if (amount > currentBalance) throw new Error(`Payment ${rupees(amount)} is greater than ${customerName}’s remaining balance of ${rupees(currentBalance)}.`);
          balance = currentBalance - amount;
          transaction.set(customerRef, { name: snapshot.data().name || customerName, balance }, { merge: true });
          transaction.set(activityRef, { type: "payment", message: originalMessage, customer: customerName, amount, balance, items: [], createdAt: serverTimestamp() });
        });
        showToast(`Payment recorded for ${customerName}. Outstanding: ${rupees(balance)}.`);
        return true;
      }

      const creditMatch = parsedMessage.match(/^\s*(.+?)\s+(?:took|bought)\s+(.+?)\s+on\s+credit\s*$/i);
      const action = lower.match(/\b(sold|sale|received|restocked|damaged|returned|return)\b/);
      const isCredit = Boolean(creditMatch);
      if (!isCredit && !action) throw new Error("I couldn’t find an action. Try “sold 3 Maggi”, “received 20 rice bags”, or the Kannada examples in Chat help.");
      const type = isCredit ? "credit" : ({ sold: "sold", sale: "sold", received: "received", restocked: "received", damaged: "damaged", returned: "returned", return: "returned" })[action[1]];
      const customerName = creditMatch?.[1].trim();
      const details = creditMatch?.[2] || parsedMessage.slice(action.index + action[0].length);
      const candidates = [...products].sort((a, b) => b.name.length - a.name.length);
      const matches = [];
      const pattern = /(\d+)\s+([a-z][a-z -]*?)(?=\s*,\s*|\s+and\s+|$)/gi;
      for (const found of details.matchAll(pattern)) {
        const quantity = Number(found[1]);
        const description = found[2].trim().toLowerCase();
        const product = candidates.find((candidate) => description.includes(candidate.name.toLowerCase()));
        if (product && quantity > 0) matches.push({ product, quantity });
      }
      if (!matches.length) throw new Error("I couldn’t match an item and quantity. Try “sold 3 Maggi and 2 milk”.");
      const uniqueIds = new Set(matches.map(({ product }) => product.id));
      if (uniqueIds.size !== matches.length) throw new Error("Please mention each product once in a message.");
      const refs = matches.map(({ product }) => doc(productsCollection, product.id));
      const activityRef = doc(collection(db, "users", user.uid, "activities"));
      const customerId = isCredit ? customerDocumentId(customerName) : "";
      if (isCredit && !customerId) throw new Error("Please include a customer name using English or Kannada letters.");
      const customerRef = isCredit ? doc(db, "users", user.uid, "customers", customerId) : null;
      let responseItems = [];
      let creditAmount = 0;
      let outstanding = 0;
      await runTransaction(db, async (transaction) => {
        const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
        const customerSnapshot = customerRef ? await transaction.get(customerRef) : null;
        responseItems = snapshots.map((snapshot, index) => {
          if (!snapshot.exists()) throw new Error("A product in your message is no longer in inventory.");
          const stored = snapshot.data();
          const quantity = matches[index].quantity;
          const before = Number(stored.stock || 0);
          const add = ["received", "returned"].includes(type);
          const after = add ? before + quantity : before - quantity;
          if (after < 0) throw new Error(`${stored.name} has only ${before} ${stored.unit} in stock.`);
          const price = Number(stored.price || 0);
          transaction.update(refs[index], { stock: after });
          return { name: stored.name, quantity, before, after, unit: stored.unit, price };
        });
        if (isCredit) {
          if (!customerSnapshot.exists()) {
            const customer = { name: customerName, balance: 0 };
            transaction.set(customerRef, customer);
          }
          creditAmount = responseItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
          outstanding = Number(customerSnapshot?.data()?.balance || 0) + creditAmount;
          transaction.set(customerRef, { name: customerName, balance: outstanding }, { merge: true });
        }
        transaction.set(activityRef, {
          type, message: originalMessage, items: responseItems, ...(isCredit ? { customer: customerName, amount: creditAmount, balance: outstanding } : {}),
          ...(type === "sold" ? { amount: responseItems.reduce((sum, item) => sum + item.quantity * item.price, 0) } : {}),
          createdAt: serverTimestamp(),
        });
      });
      showToast(isCredit ? `Credit recorded for ${customerName}: ${rupees(creditAmount)}.` : `Updated: ${responseItems.map((item) => `${item.name} ${item.before} → ${item.after}`).join(", ")}.`);
      return true;
    } catch (error) {
      showToast(error.message || "Could not save this update. Please try again.");
      return false;
    } finally { setBusy(false); }
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const alerts = products.filter((item) => item.stock <= item.minStock);
  return <div className="app-shell">
    <Sidebar active={page} onNavigate={setPage} user={user} onSignOut={() => signOut(auth)} shopName={shopName} />
    <main className="main-area">
      <header className="main-header"><div className="mobile-brand"><span className="brand-mark"><Store size={20} /></span><b>KiranaShop</b></div><div className="greeting"><span className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</span><h1>{greeting}, {user.displayName?.split(" ")[0] || "Ramesh"}! <span className="wave">👋</span></h1><p>Tell me what happened in your shop. I’ll update your stock, sales and records.</p></div><div className="header-actions"><div className="notification-wrap"><button className="header-icon" aria-label="Notifications" onClick={() => setNoticeOpen(!noticeOpen)}><Bell size={19} />{alerts.length > 0 && <span className="notification-dot" />}</button>{noticeOpen && <div className="notification-popover"><b>Stock alerts</b>{alerts.length ? alerts.map((item) => <span key={item.id}>{item.name}: {item.stock} {item.unit} left</span>) : <span>No active low-stock alerts.</span>}</div>}</div><div className="profile-menu-wrap"><button className="profile-circle" aria-label="Owner profile menu" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>{profileInitial}</button>{profileMenuOpen && <div className="profile-popover"><b>{shopName}</b><span>{user.email}</span><button onClick={() => signOut(auth)}><LogOut size={14} /> Sign out</button></div>}</div></div></header>
      <div className="workspace-grid">
        <div className="workspace-main">{page === "Chat" ? <ChatView user={user} products={products} activities={activities} onSend={sendMessage} busy={busy} onReorder={makeReorder} inventoryStatus={inventoryStatus} inventoryError={inventoryError} onRetryInventory={() => setInventoryRetry((value) => value + 1)} /> : <PageContent page={page} products={products} activities={activities} customers={customers} onUpdateMinStock={updateMinimum} onReorder={makeReorder} shopName={shopName} setShopName={setShopName} onAddCredit={addCustomerCredit} onRecordPayment={recordCustomerPayment} />}</div>
        <SidePanel products={products} activities={activities} customers={customers} onReorder={makeReorder} onNavigate={setPage} />
      </div>
    </main>
    {toast && <div className="toast"><AlertTriangle size={17} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
  </div>;
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!isFirebaseConfigured) return <main className="setup-page"><div className="setup-card"><span className="brand-mark"><Store size={24} /></span><p className="eyebrow">ONE QUICK SETUP</p><h1>Connect your Firebase project</h1><p>KiranaShop uses Firebase Authentication and Cloud Firestore to securely save owner accounts, inventory, activity, and customer balances.</p><ol><li>Create a Firebase project and enable <b>Email/Password</b> sign-in.</li><li>Create a Cloud Firestore database.</li><li>Copy <code>.env.example</code> to <code>.env.local</code> and add your Firebase web app config.</li><li>Apply the included <code>firestore.rules</code>, then restart the app.</li></ol><div className="setup-status"><AlertTriangle size={18} /><span>Firebase is not configured yet. Sign-in and cloud persistence are disabled until setup is complete.</span></div></div></main>;
  if (user === undefined) return <main className="loading-page"><span className="spinner dark" />Connecting securely…</main>;
  return user ? <Dashboard user={user} /> : <LoginPage />;
}
