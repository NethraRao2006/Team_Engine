import { Product, Activity, Customer, AuditLogEntry, ShopProfile, AuditDiff } from '../types';

export const STARTER_PRODUCTS: Product[] = [
  { id: 'maggi', name: 'Maggi Noodles', stock: 40, minStock: 10, unit: 'packets', price: 14, color: 'orange', category: 'Packaged' },
  { id: 'milk', name: 'Nandini Milk', stock: 12, minStock: 8, unit: 'packets', price: 28, color: 'blue', category: 'Dairy' },
  { id: 'rice', name: 'Sona Masoori Rice', stock: 30, minStock: 10, unit: 'bags', price: 500, color: 'green', category: 'Grains & Staples' },
  { id: 'oil', name: 'Cooking Sunflower Oil', stock: 2, minStock: 5, unit: 'bottles', price: 160, color: 'yellow', category: 'Oils & Ghee' },
  { id: 'biscuits', name: 'Parle-G Biscuits', stock: 3, minStock: 10, unit: 'packets', price: 10, color: 'pink', category: 'Snacks' },
  { id: 'sugar', name: 'White Sugar', stock: 5, minStock: 8, unit: 'kg', price: 45, color: 'purple', category: 'Grains & Staples' },
  { id: 'atta', name: 'Aashirvaad Wheat Atta', stock: 18, minStock: 6, unit: 'kg', price: 42, color: 'yellow', category: 'Grains & Staples' },
  { id: 'toor-dal', name: 'Toor Dal Premium', stock: 14, minStock: 5, unit: 'kg', price: 150, color: 'orange', category: 'Pulses' },
  { id: 'chana-dal', name: 'Chana Dal', stock: 12, minStock: 5, unit: 'kg', price: 90, color: 'yellow', category: 'Pulses' },
  { id: 'salt', name: 'Tata Salt', stock: 24, minStock: 8, unit: 'packets', price: 22, color: 'blue', category: 'Spices & Essentials' },
  { id: 'tea', name: 'Red Label Tea Powder', stock: 16, minStock: 5, unit: 'packets', price: 120, color: 'green', category: 'Beverages' },
  { id: 'coffee', name: 'BRU Instant Coffee', stock: 10, minStock: 4, unit: 'packets', price: 110, color: 'purple', category: 'Beverages' },
  { id: 'soap', name: 'Lifebuoy Bath Soap', stock: 20, minStock: 6, unit: 'bars', price: 35, color: 'pink', category: 'Personal Care' },
  { id: 'shampoo', name: 'Clinic Plus Shampoo', stock: 15, minStock: 5, unit: 'sachets', price: 2, color: 'purple', category: 'Personal Care' },
  { id: 'toothpaste', name: 'Colgate Toothpaste', stock: 9, minStock: 4, unit: 'tubes', price: 55, color: 'blue', category: 'Personal Care' },
  { id: 'detergent', name: 'Surf Excel Detergent', stock: 13, minStock: 5, unit: 'packets', price: 65, color: 'green', category: 'Household' },
  { id: 'bread', name: 'Modern Sliced Bread', stock: 8, minStock: 3, unit: 'loaves', price: 40, color: 'yellow', category: 'Bakery' },
  { id: 'eggs', name: 'Farm Fresh Eggs', stock: 30, minStock: 12, unit: 'eggs', price: 7, color: 'orange', category: 'Dairy & Poultry' },
  { id: 'noodles', name: 'Top Ramen Noodles', stock: 17, minStock: 6, unit: 'packets', price: 14, color: 'pink', category: 'Packaged' },
  { id: 'ghee', name: 'Nandini Pure Ghee', stock: 7, minStock: 3, unit: 'jars', price: 320, color: 'yellow', category: 'Oils & Ghee' },
  { id: 'turmeric', name: 'Everest Turmeric Powder', stock: 11, minStock: 4, unit: 'packets', price: 38, color: 'orange', category: 'Spices & Essentials' },
  { id: 'chilli-powder', name: 'Kashmiri Chilli Powder', stock: 9, minStock: 4, unit: 'packets', price: 42, color: 'pink', category: 'Spices & Essentials' },
  { id: 'onion', name: 'Red Onions', stock: 20, minStock: 8, unit: 'kg', price: 35, color: 'purple', category: 'Vegetables' },
  { id: 'potato', name: 'Fresh Potatoes', stock: 22, minStock: 8, unit: 'kg', price: 30, color: 'yellow', category: 'Vegetables' },
  { id: 'water', name: 'Bisleri Mineral Water 1L', stock: 18, minStock: 6, unit: 'bottles', price: 20, color: 'blue', category: 'Beverages' },
];

export const STARTER_CUSTOMERS: Customer[] = [
  { id: 'ramesh', name: 'Ramesh Gowda', balance: 450, phone: '9845012345', updatedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 'suresh', name: 'Suresh Kumar', balance: 620, phone: '9845098765', updatedAt: new Date(Date.now() - 3600000 * 12).toISOString() },
  { id: 'priya', name: 'Priya Sharma', balance: 280, phone: '9740112233', updatedAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'anand', name: 'Anand Rao', balance: 500, phone: '9900223344', updatedAt: new Date(Date.now() - 3600000 * 48).toISOString() },
];

export const STARTER_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'sold',
    message: 'Sold 3 Maggi Noodles and 2 Nandini Milk',
    items: [
      { name: 'Maggi Noodles', quantity: 3, before: 43, after: 40, unit: 'packets', price: 14 },
      { name: 'Nandini Milk', quantity: 2, before: 14, after: 12, unit: 'packets', price: 28 },
    ],
    amount: 98,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    actor: 'Owner (Ramesh)',
    channel: 'voice_kannada',
  },
  {
    id: 'act-2',
    type: 'credit',
    message: 'Ramesh Gowda took 2 Sona Masoori Rice on credit',
    items: [
      { name: 'Sona Masoori Rice', quantity: 2, before: 32, after: 30, unit: 'bags', price: 500 },
    ],
    customer: 'Ramesh Gowda',
    amount: 1000,
    balance: 450,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: 'Owner (Ramesh)',
    channel: 'chat_command',
  },
  {
    id: 'act-3',
    type: 'payment',
    message: 'Ramesh Gowda paid ₹550',
    customer: 'Ramesh Gowda',
    amount: 550,
    balance: 450,
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    actor: 'Cashier (Anil)',
    channel: 'manual_ui',
  },
  {
    id: 'act-4',
    type: 'received',
    message: 'Received 20 Sona Masoori Rice bags',
    items: [
      { name: 'Sona Masoori Rice', quantity: 20, before: 10, after: 30, unit: 'bags', price: 500 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    actor: 'Owner (Ramesh)',
    channel: 'voice_english',
  },
];

export const STARTER_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    category: 'inventory',
    action: 'SALE_PROCESSED',
    actor: 'Owner (Ramesh)',
    summary: 'Voice Sale: Sold 3 Maggi Noodles & 2 Nandini Milk (Total ₹98)',
    diffs: [
      { entity: 'Maggi Noodles', field: 'stock', before: 43, after: 40, unit: 'packets' },
      { entity: 'Nandini Milk', field: 'stock', before: 14, after: 12, unit: 'packets' },
    ],
    severity: 'info',
    channel: 'voice_kannada',
    metadata: { paymentMethod: 'Cash', totalAmount: 98 },
  },
  {
    id: 'aud-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    category: 'financial',
    action: 'UDHAAR_CREDIT_ISSUED',
    actor: 'Owner (Ramesh)',
    summary: 'Recorded ₹1,000 credit sale for Ramesh Gowda (2 Rice bags)',
    diffs: [
      { entity: 'Sona Masoori Rice', field: 'stock', before: 32, after: 30, unit: 'bags' },
      { entity: 'Ramesh Gowda', field: 'udhaarBalance', before: 0, after: 1000, unit: '₹' },
    ],
    severity: 'warning',
    channel: 'chat_command',
  },
  {
    id: 'aud-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    category: 'financial',
    action: 'UDHAAR_PAYMENT_SETTLED',
    actor: 'Cashier (Anil)',
    summary: 'Settled ₹550 partial payment from Ramesh Gowda. Remaining balance: ₹450',
    diffs: [
      { entity: 'Ramesh Gowda', field: 'udhaarBalance', before: 1000, after: 450, unit: '₹' },
    ],
    severity: 'success',
    channel: 'manual_ui',
  },
  {
    id: 'aud-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    category: 'inventory',
    action: 'STOCK_RESTOCKED',
    actor: 'Owner (Ramesh)',
    summary: 'Supplier Goods Received: 20 Sona Masoori Rice bags added to warehouse shelf',
    diffs: [
      { entity: 'Sona Masoori Rice', field: 'stock', before: 10, after: 30, unit: 'bags' },
    ],
    severity: 'success',
    channel: 'voice_english',
  },
  {
    id: 'aud-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    category: 'settings',
    action: 'MIN_STOCK_UPDATED',
    actor: 'Owner (Ramesh)',
    summary: 'Safety stock threshold for Cooking Sunflower Oil updated from 3 to 5 bottles',
    diffs: [
      { entity: 'Cooking Sunflower Oil', field: 'minStock', before: 3, after: 5, unit: 'bottles' },
    ],
    severity: 'info',
    channel: 'manual_ui',
  },
];

export const DEFAULT_PROFILE: ShopProfile = {
  name: 'Sharma General Store',
  ownerName: 'Ramesh Sharma',
  phone: '9845011223',
  supplierPhone: '919876543210',
  upiId: 'sharmastore@okhdfcbank',
  currentRole: 'Owner',
  address: 'Shop #14, Main Bazaar, Bengaluru',
};

const STORAGE_KEYS = {
  PRODUCTS: 'team_engine_kirana_products',
  ACTIVITIES: 'team_engine_kirana_activities',
  CUSTOMERS: 'team_engine_kirana_customers',
  AUDIT_LOGS: 'team_engine_kirana_audit_logs',
  PROFILE: 'team_engine_kirana_profile',
};

class StoreService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(STARTER_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(STARTER_CUSTOMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(STARTER_ACTIVITIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(STARTER_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Products
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : STARTER_PRODUCTS;
    } catch {
      return STARTER_PRODUCTS;
    }
  }

  saveProduct(product: Product, actor = 'Owner (Ramesh)') {
    const products = this.getProducts();
    const existingIndex = products.findIndex((p) => p.id === product.id);
    let diffs: AuditDiff[] = [];

    if (existingIndex >= 0) {
      const old = products[existingIndex];
      diffs = [
        { entity: product.name, field: 'stock', before: old.stock, after: product.stock, unit: product.unit },
        { entity: product.name, field: 'price', before: `₹${old.price}`, after: `₹${product.price}` },
        { entity: product.name, field: 'minStock', before: old.minStock, after: product.minStock, unit: product.unit },
      ].filter((d) => d.before !== d.after);

      products[existingIndex] = product;

      this.addAuditLog({
        category: 'inventory',
        action: 'PRODUCT_UPDATED',
        actor,
        summary: `Updated details for ${product.name}`,
        diffs,
        severity: 'info',
        channel: 'manual_ui',
      });
    } else {
      products.push(product);
      this.addAuditLog({
        category: 'inventory',
        action: 'PRODUCT_CREATED',
        actor,
        summary: `Added new item: ${product.name} (Stock: ${product.stock} ${product.unit}, Price: ₹${product.price})`,
        severity: 'success',
        channel: 'manual_ui',
      });
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notify();
  }

  updateMinStock(productId: string, newMinStock: number, actor = 'Owner (Ramesh)') {
    const products = this.getProducts();
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const oldMin = target.minStock;
    target.minStock = newMinStock;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    this.addAuditLog({
      category: 'settings',
      action: 'MIN_STOCK_UPDATED',
      actor,
      summary: `Changed reorder threshold for ${target.name} from ${oldMin} to ${newMinStock} ${target.unit}`,
      diffs: [{ entity: target.name, field: 'minStock', before: oldMin, after: newMinStock, unit: target.unit }],
      severity: 'info',
      channel: 'manual_ui',
    });

    this.notify();
  }

  quickAdjustStock(productId: string, delta: number, actor = 'Owner (Ramesh)') {
    const products = this.getProducts();
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const before = target.stock;
    const after = Math.max(0, before + delta);
    target.stock = after;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    const isAddition = delta > 0;
    this.addAuditLog({
      category: 'inventory',
      action: isAddition ? 'STOCK_RESTOCKED' : 'QUICK_STOCK_REDUCTION',
      actor,
      summary: `Quick adjust: ${target.name} ${isAddition ? '+' : ''}${delta} ${target.unit} (${before} → ${after})`,
      diffs: [{ entity: target.name, field: 'stock', before, after, unit: target.unit }],
      severity: isAddition ? 'success' : 'warning',
      channel: 'quick_action',
    });

    this.notify();
  }

  // Customers (Udhaar)
  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : STARTER_CUSTOMERS;
    } catch {
      return STARTER_CUSTOMERS;
    }
  }

  addCustomerCredit(name: string, rawAmount: number, phone?: string, actor = 'Owner (Ramesh)', channel: 'voice_kannada' | 'voice_english' | 'quick_action' | 'chat_command' | 'manual_ui' = 'manual_ui') {
    const customerName = name.trim();
    const amount = Number(rawAmount);
    if (!customerName || amount <= 0) return false;

    const customers = this.getCustomers();
    const id = customerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let customer = customers.find((c) => c.id === id);

    let beforeBalance = 0;
    let afterBalance = amount;

    if (customer) {
      beforeBalance = customer.balance;
      afterBalance = beforeBalance + amount;
      customer.balance = afterBalance;
      if (phone) customer.phone = phone;
      customer.updatedAt = new Date().toISOString();
    } else {
      customer = {
        id,
        name: customerName,
        balance: amount,
        phone: phone || '',
        updatedAt: new Date().toISOString(),
      };
      customers.push(customer);
    }

    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    // Log Activity
    const activity: Activity = {
      id: 'act-' + Date.now(),
      type: 'credit',
      message: `Added ₹${amount.toLocaleString('en-IN')} credit for ${customerName}`,
      customer: customerName,
      amount,
      balance: afterBalance,
      createdAt: new Date().toISOString(),
      actor,
      channel,
    };
    this.addActivity(activity);

    // Write Audit Log
    this.addAuditLog({
      category: 'financial',
      action: 'UDHAAR_CREDIT_ADDED',
      actor,
      summary: `Added ₹${amount.toLocaleString('en-IN')} udhaar for ${customerName}. New balance: ₹${afterBalance.toLocaleString('en-IN')}`,
      diffs: [{ entity: customerName, field: 'udhaarBalance', before: `₹${beforeBalance}`, after: `₹${afterBalance}` }],
      severity: 'warning',
      channel,
      metadata: { customerName, creditAmount: amount, currentBalance: afterBalance },
    });

    this.notify();
    return true;
  }

  recordCustomerPayment(name: string, rawAmount: number, actor = 'Cashier (Anil)', channel: 'voice_kannada' | 'voice_english' | 'quick_action' | 'chat_command' | 'manual_ui' = 'manual_ui') {
    const customerName = name.trim();
    const amount = Number(rawAmount);
    if (!customerName || amount <= 0) return false;

    const customers = this.getCustomers();
    const id = customerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const customer = customers.find((c) => c.id === id || c.name.toLowerCase() === customerName.toLowerCase());

    if (!customer) {
      throw new Error(`No customer record found for "${customerName}".`);
    }

    const beforeBalance = customer.balance;
    if (amount > beforeBalance) {
      throw new Error(`Payment ₹${amount} exceeds current pending balance ₹${beforeBalance}.`);
    }

    const afterBalance = beforeBalance - amount;
    customer.balance = afterBalance;
    customer.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    // Log Activity
    const activity: Activity = {
      id: 'act-' + Date.now(),
      type: 'payment',
      message: `${customer.name} paid ₹${amount.toLocaleString('en-IN')}`,
      customer: customer.name,
      amount,
      balance: afterBalance,
      createdAt: new Date().toISOString(),
      actor,
      channel,
    };
    this.addActivity(activity);

    // Write Audit Log
    this.addAuditLog({
      category: 'financial',
      action: 'UDHAAR_PAYMENT_SETTLED',
      actor,
      summary: `Payment received: ₹${amount.toLocaleString('en-IN')} from ${customer.name}. Remaining udhaar: ₹${afterBalance.toLocaleString('en-IN')}`,
      diffs: [{ entity: customer.name, field: 'udhaarBalance', before: `₹${beforeBalance}`, after: `₹${afterBalance}` }],
      severity: 'success',
      channel,
      metadata: { customerName: customer.name, amountPaid: amount, remainingBalance: afterBalance },
    });

    this.notify();
    return true;
  }

  // Activities
  getActivities(): Activity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return data ? JSON.parse(data) : STARTER_ACTIVITIES;
    } catch {
      return STARTER_ACTIVITIES;
    }
  }

  addActivity(activity: Activity) {
    const activities = this.getActivities();
    activities.unshift(activity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities.slice(0, 100)));
    this.notify();
  }

  // Audit Logs (CRITICAL FEATURE)
  getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : STARTER_AUDIT_LOGS;
    } catch {
      return STARTER_AUDIT_LOGS;
    }
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));
    this.notify();
    return newEntry;
  }

  clearAuditLogs() {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    this.notify();
  }

  // Shop Profile
  getShopProfile(): ShopProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  saveShopProfile(profile: ShopProfile, actor = 'Owner (Ramesh)') {
    const old = this.getShopProfile();
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

    this.addAuditLog({
      category: 'settings',
      action: 'SETTINGS_UPDATED',
      actor,
      summary: `Store profile settings updated (${profile.name})`,
      diffs: [
        { entity: 'Shop Profile', field: 'name', before: old.name, after: profile.name },
        { entity: 'Shop Profile', field: 'upiId', before: old.upiId, after: profile.upiId },
      ].filter((d) => d.before !== d.after),
      severity: 'info',
      channel: 'manual_ui',
    });

    this.notify();
  }

  // Reset to starter state
  resetAll() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(STARTER_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(STARTER_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(STARTER_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(STARTER_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));

    this.addAuditLog({
      category: 'security',
      action: 'SYSTEM_RESET',
      actor: 'System Admin',
      summary: 'Store data reset to default demo dataset',
      severity: 'warning',
      channel: 'system',
    });

    this.notify();
  }
}

export const store = new StoreService();
