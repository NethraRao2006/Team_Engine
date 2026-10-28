require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'kirana-demo-secret';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    const defaultData = {
      shop: { name: 'Demo Shop', username: 'shopkeeper', password: 'demo123' },
      inventory: [],
      customers: [],
      transactions: [],
      chatHistory: []
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    if (!raw.trim()) {
      return { shop: { name: 'Demo Shop', username: 'shopkeeper', password: 'demo123' }, inventory: [], customers: [], transactions: [], chatHistory: [] };
    }
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Could not read data.json. Please check the file format.');
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function ensureSession(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  next();
}

function oneOf(names, value) {
  return names.some((name) => value && value.toLowerCase().includes(name));
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getItemByName(data, itemName) {
  if (!itemName) return null;
  const normalized = itemName.trim().toLowerCase();
  return data.inventory.find((item) => item.name.toLowerCase() === normalized);
}

function getCustomerByName(data, customerName) {
  if (!customerName) return null;
  const normalized = customerName.trim().toLowerCase();
  return data.customers.filter((customer) => customer.name.toLowerCase() === normalized);
}

function getUnitFromItemText(itemName) {
  const lower = itemName.toLowerCase();
  if (lower.includes('rice')) return 'bags';
  if (lower.includes('milk')) return 'packets';
  if (lower.includes('maggi')) return 'packets';
  if (lower.includes('oil')) return 'bottles';
  if (lower.includes('egg')) return 'pieces';
  return 'units';
}

function sanitizeName(value) {
  if (!value) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function getTextFromGeminiResponse(response) {
  const directText = typeof response?.text === 'string' ? response.text : '';
  if (directText) return directText;

  if (Array.isArray(response?.candidates)) {
    const candidate = response.candidates[0];
    const textChunk = candidate?.content?.parts?.map((part) => part?.text || '').join('');
    if (textChunk) return textChunk;
  }

  if (response?.output_text) return response.output_text;
  return '';
}

async function interpretWithGemini(message) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are parsing a shopkeeper's message for a kirana ledger app. Extract one or more transactions. Return only valid JSON with this shape:
{
  "transactions": [
    { "action": "sale|received|damage|return|credit|payment",
      "itemName": "string or null",
      "quantity": 0,
      "unit": "string or null",
      "customerName": "string or null",
      "amount": 0,
      "confidence": 0.0,
      "needsClarification": false,
      "clarificationQuestion": ""
    }
  ],
  "needsClarification": false,
  "clarificationQuestion": ""
}
Rules:
- Never invent item names, customer names, quantities, or amounts.
- If the message is vague or missing information, set needsClarification true and provide clarificationQuestion.
- For a customer payment, use action = \"payment\" and set customerName and amount.
- For credit purchases, use action = \"credit\" and include the customer and item.
- Do not include markdown fences.
- Message: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = getTextFromGeminiResponse(response);
    const cleaned = String(text).replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    return { error: error.message || 'Gemini parsing failed.' };
  }
}

function extractItemName(rawText) {
  let text = rawText
    .replace(/\b(?:sold|sale|sell|saled|received|damage|damaged|return(?:ed)?|credit|udhaar|paid|payment|took|took\s+on|on|for|and|with)\b/gi, ' ')
    .replace(/\b(?:kg|g|ml|l|litre|litres|piece|pieces|packet|packets|bag|bags|bottle|bottles|rs|rupees|₹|inr)\b/gi, ' ')
    .replace(/[0-9.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';
  return text.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
}

function extractNumber(text) {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function normalizeAction(action) {
  const lower = String(action || '').toLowerCase().trim();
  if (['sale', 'sold', 'sell', 'saled'].includes(lower)) return 'sale';
  if (['received', 'receive', 'got', 'bought'].includes(lower)) return 'received';
  if (['damage', 'damaged', 'broken', 'broke'].includes(lower)) return 'damage';
  if (['return', 'returned', 'refund'].includes(lower)) return 'return';
  if (['credit', 'udhaar', 'on credit', 'onudhaar'].includes(lower)) return 'credit';
  if (['payment', 'paid'].includes(lower)) return 'payment';
  return lower || '';
}

function parseFallbackMessage(message, data) {
  const text = String(message || '').trim();
  if (!text) {
    return {
      needsClarification: true,
      clarificationQuestion: 'Please tell me the item, quantity, and action.'
    };
  }

  const lowered = text.toLowerCase();

  if (/(paid|payment)/i.test(text)) {
    const amount = extractNumber(text) || 0;
    const customerName = sanitizeName(text.replace(/(paid|payment|₹|rs|rupees)/gi, ' ').replace(/\d+/g, '').replace(/\s+/g, ' ').trim());
    return {
      transactions: [{
        action: 'payment',
        itemName: null,
        quantity: null,
        unit: null,
        customerName: customerName || null,
        amount,
        confidence: 0.8,
        needsClarification: !customerName,
        clarificationQuestion: !customerName ? 'Which customer paid?' : ''
      }],
      needsClarification: !customerName,
      clarificationQuestion: !customerName ? 'Which customer paid?' : ''
    };
  }

  if (/(on credit|udhaar|credit|took)/i.test(text)) {
    const quantity = extractNumber(text) || 1;
    const itemName = sanitizeName(extractItemName(text));
    const customerName = sanitizeName(text.replace(/(on credit|udhaar|credit|took|paid|payment|received|sold|sale|sell)/gi, ' ').replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim());
    const item = getItemByName(data, itemName) || null;
    return {
      transactions: [{
        action: 'credit',
        itemName: item ? item.name : itemName || null,
        quantity,
        unit: item ? item.unit : getUnitFromItemText(itemName),
        customerName: customerName || null,
        amount: item ? Number(item.unitPrice || 0) * quantity : null,
        confidence: item ? 0.86 : 0.65,
        needsClarification: !itemName || !customerName,
        clarificationQuestion: !itemName || !customerName ? 'Please tell me which item and customer are involved.' : ''
      }],
      needsClarification: !itemName || !customerName,
      clarificationQuestion: !itemName || !customerName ? 'Please tell me which item and customer are involved.' : ''
    };
  }

  if (/(sold|sale|sell|saled)/i.test(text)) {
    const quantity = extractNumber(text) || 0;
    const itemName = sanitizeName(extractItemName(text));
    const item = getItemByName(data, itemName) || null;
    return {
      transactions: [{
        action: 'sale',
        itemName: item ? item.name : itemName || null,
        quantity,
        unit: item ? item.unit : getUnitFromItemText(itemName),
        customerName: null,
        amount: item ? Number(item.unitPrice || 0) * quantity : null,
        confidence: item ? 0.88 : 0.62,
        needsClarification: !itemName || quantity <= 0,
        clarificationQuestion: !itemName || quantity <= 0 ? 'Which item was sold, and in what quantity?' : ''
      }],
      needsClarification: !itemName || quantity <= 0,
      clarificationQuestion: !itemName || quantity <= 0 ? 'Which item was sold, and in what quantity?' : ''
    };
  }

  if (/(received|get|got|bought)/i.test(text)) {
    const quantity = extractNumber(text) || 0;
    const itemName = sanitizeName(extractItemName(text));
    const item = getItemByName(data, itemName) || null;
    return {
      transactions: [{
        action: 'received',
        itemName: item ? item.name : itemName || null,
        quantity,
        unit: item ? item.unit : getUnitFromItemText(itemName),
        customerName: null,
        amount: null,
        confidence: item ? 0.82 : 0.6,
        needsClarification: !itemName || quantity <= 0,
        clarificationQuestion: !itemName || quantity <= 0 ? 'Which item was received, and in what quantity?' : ''
      }],
      needsClarification: !itemName || quantity <= 0,
      clarificationQuestion: !itemName || quantity <= 0 ? 'Which item was received, and in what quantity?' : ''
    };
  }

  if (/(damage|damaged|broken|broke)/i.test(text)) {
    const quantity = extractNumber(text) || 0;
    const itemName = sanitizeName(extractItemName(text));
    const item = getItemByName(data, itemName) || null;
    return {
      transactions: [{
        action: 'damage',
        itemName: item ? item.name : itemName || null,
        quantity,
        unit: item ? item.unit : getUnitFromItemText(itemName),
        customerName: null,
        amount: null,
        confidence: item ? 0.8 : 0.58,
        needsClarification: !itemName || quantity <= 0,
        clarificationQuestion: !itemName || quantity <= 0 ? 'Which item was damaged, and by how much?' : ''
      }],
      needsClarification: !itemName || quantity <= 0,
      clarificationQuestion: !itemName || quantity <= 0 ? 'Which item was damaged, and by how much?' : ''
    };
  }

  return {
    needsClarification: true,
    clarificationQuestion: 'Please say what was sold, received, damaged, returned, or paid.'
  };
}

function applyTransaction(data, transaction) {
  const validActions = ['sale', 'received', 'damage', 'return', 'credit', 'payment'];
  const action = normalizeAction(transaction.action);

  if (!validActions.includes(action)) {
    return { success: false, message: 'Unsupported action. Please use sale, received, damage, return, credit, or payment.' };
  }

  if (transaction.needsClarification) {
    return { success: false, message: transaction.clarificationQuestion || 'Please provide more details.' };
  }

  if (action === 'payment') {
    const customerMatches = getCustomerByName(data, transaction.customerName || '');
    if (!transaction.customerName) {
      return { success: false, message: 'Which customer made the payment?' };
    }
    if (customerMatches.length > 1) {
      return { success: false, message: 'There are multiple customers with that name. Please choose the correct one.' };
    }
    if (!customerMatches[0]) {
      return { success: false, message: `Customer "${transaction.customerName}" was not found. Add the customer first.` };
    }

    const customer = customerMatches[0];
    const amount = Number(transaction.amount || 0);
    if (!amount || amount <= 0) {
      return { success: false, message: 'Payment amount is missing or invalid.' };
    }

    customer.balance = Math.max(0, Number(customer.balance || 0) - amount);
    customer.transactions.push({
      date: getTodayDate(),
      type: 'payment',
      amount,
      note: `Payment received from ${customer.name}`
    });

    data.transactions.push({
      id: generateId('tx'),
      date: getTodayDate(),
      type: 'payment',
      customer: customer.name,
      amount
    });

    return { success: true, message: `Payment of ₹${amount} recorded. ${customer.name}'s balance is now ₹${customer.balance}.` };
  }

  if (action === 'credit') {
    const item = getItemByName(data, transaction.itemName || '');
    if (!item) {
      return { success: false, message: `Item "${transaction.itemName}" not found in inventory.` };
    }

    const customerMatches = getCustomerByName(data, transaction.customerName || '');
    if (!transaction.customerName) {
      return { success: false, message: 'Which customer took this on credit?' };
    }
    if (customerMatches.length > 1) {
      return { success: false, message: 'There are multiple customers with that name. Please choose the correct one.' };
    }
    if (customerMatches.length === 0) {
      return { success: false, message: `Customer "${transaction.customerName}" not found. Please add the customer first.` };
    }

    const quantity = Number(transaction.quantity || 0);
    if (!quantity || quantity <= 0) {
      return { success: false, message: 'Credit quantity is missing or invalid.' };
    }
    if (item.quantity < quantity) {
      return { success: false, message: `Not enough ${item.name} stock to record this credit. Available: ${item.quantity}.` };
    }

    const amount = Number(transaction.amount || item.unitPrice * quantity || 0);
    item.quantity -= quantity;
    item.stockHistory.push({
      date: getTodayDate(),
      action: 'credit',
      quantity,
      resultingStock: item.quantity
    });

    const customer = customerMatches[0];
    customer.balance = Number(customer.balance || 0) + amount;
    customer.transactions.push({
      date: getTodayDate(),
      type: 'credit',
      item: item.name,
      quantity,
      unit: item.unit,
      amount,
      note: `${item.name} taken on credit`
    });

    data.transactions.push({
      id: generateId('tx'),
      date: getTodayDate(),
      type: 'credit',
      customer: customer.name,
      item: item.name,
      quantity,
      unit: item.unit,
      amount
    });

    return { success: true, message: `Added ${quantity} ${item.unit} of ${item.name} to ${customer.name}'s Udhaar. Outstanding balance updated.` };
  }

  const item = getItemByName(data, transaction.itemName || '');
  if (!item) {
    return { success: false, message: `Item "${transaction.itemName}" not found in inventory.` };
  }

  const quantity = Number(transaction.quantity || 0);
  if (!quantity || quantity <= 0) {
    return { success: false, message: 'Quantity is missing or invalid.' };
  }

  if ((action === 'sale' || action === 'damage') && item.quantity < quantity) {
    return { success: false, message: `Not enough ${item.name} stock. Available: ${item.quantity}.` };
  }

  if (action === 'sale') {
    item.quantity -= quantity;
    item.stockHistory.push({
      date: getTodayDate(),
      action: 'sale',
      quantity,
      resultingStock: item.quantity
    });
    data.transactions.push({
      id: generateId('tx'),
      date: getTodayDate(),
      type: 'sale',
      item: item.name,
      quantity,
      unit: item.unit,
      amount: Number(transaction.amount || item.unitPrice * quantity)
    });
    return { success: true, message: `Done! ${item.name}: ${item.quantity + quantity} → ${item.quantity} ${item.unit}.` };
  }

  if (action === 'received') {
    item.quantity += quantity;
    item.stockHistory.push({
      date: getTodayDate(),
      action: 'received',
      quantity,
      resultingStock: item.quantity
    });
    data.transactions.push({
      id: generateId('tx'),
      date: getTodayDate(),
      type: 'received',
      item: item.name,
      quantity,
      unit: item.unit
    });
    return { success: true, message: `${item.name} stock increased by ${quantity} ${item.unit}. New stock: ${item.quantity} ${item.unit}.` };
  }

  if (action === 'damage') {
    item.quantity -= quantity;
    item.stockHistory.push({
      date: getTodayDate(),
      action: 'damage',
      quantity,
      resultingStock: item.quantity
    });
    data.transactions.push({
      id: generateId('tx'),
      date: getTodayDate(),
      type: 'damage',
      item: item.name,
      quantity,
      unit: item.unit
    });
    return { success: true, message: `Damage recorded for ${quantity} ${item.unit} of ${item.name}. Remaining stock: ${item.quantity}.` };
  }

  if (action === 'return') {
    item.quantity += quantity;
    item.stockHistory.push({
      date: getTodayDate(),
      action: 'return',
      quantity,
      resultingStock: item.quantity
    });
    data.transactions.push({
      id: generateId('tx'),
      date: getTodayDate(),
      type: 'return',
      item: item.name,
      quantity,
      unit: item.unit
    });
    return { success: true, message: `${item.name} return processed. Stock updated to ${item.quantity} ${item.unit}.` };
  }

  return { success: false, message: 'Unable to process this transaction.' };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const data = readData();
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Enter username and password.' });
  }

  if (username === data.shop.username && password === data.shop.password) {
    req.session.user = { username };
    return res.json({ success: true, message: 'Login successful.', user: { username } });
  }

  return res.status(401).json({ success: false, message: 'Invalid demo credentials.' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out.' });
  });
});

app.get('/api/session', (req, res) => {
  res.json({ loggedIn: Boolean(req.session.user), user: req.session.user || null });
});

app.get('/api/inventory', ensureSession, (req, res) => {
  const data = readData();
  res.json(data.inventory);
});

app.get('/api/customers', ensureSession, (req, res) => {
  const data = readData();
  res.json(data.customers);
});

app.get('/api/reports', ensureSession, (req, res) => {
  const data = readData();
  const totalStock = data.inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalCustomers = data.customers.length;
  const outstanding = data.customers.reduce((sum, customer) => sum + Number(customer.balance || 0), 0);
  const recentTransactions = [...data.transactions].slice(-8).reverse();

  res.json({ totalStock, totalCustomers, outstanding, recentTransactions });
});

app.get('/api/chat-history', ensureSession, (req, res) => {
  const data = readData();
  res.json(data.chatHistory);
});

app.post('/api/chat', ensureSession, async (req, res) => {
  const data = readData();
  const { message } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, message: 'Please type a message to process.' });
  }

  let parsed = null;
  if (process.env.GEMINI_API_KEY) {
    parsed = await interpretWithGemini(message);
  }

  if (!parsed || parsed.error) {
    parsed = parseFallbackMessage(message, data);
  }

  if (!parsed || parsed.needsClarification) {
    const reply = parsed?.clarificationQuestion || 'I could not understand that message. Please rephrase it.';
    data.chatHistory.push({ role: 'shopkeeper', text: message });
    data.chatHistory.push({ role: 'assistant', text: reply });
    writeData(data);
    return res.json({ success: false, message: reply, aiStatus: process.env.GEMINI_API_KEY ? 'gemini_unavailable_or_uncertain' : 'fallback' });
  }

  const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [parsed];
  const results = [];

  for (const tx of transactions) {
    const outcome = applyTransaction(data, tx);
    results.push(outcome);
    if (!outcome.success) {
      continue;
    }
  }

  const successResults = results.filter((r) => r.success);
  const finalMessage = successResults.length
    ? successResults.map((r) => r.message).join(' ')
    : results[0]?.message || 'No valid transaction was applied.';

  data.chatHistory.push({ role: 'shopkeeper', text: message });
  data.chatHistory.push({ role: 'assistant', text: finalMessage });
  writeData(data);

  res.json({
    success: successResults.length > 0,
    message: finalMessage,
    aiStatus: process.env.GEMINI_API_KEY ? 'gemini' : 'fallback',
    results
  });
});

app.get('/api/stock', ensureSession, (req, res) => {
  const data = readData();
  res.json(data.inventory.map((item) => ({
    ...item,
    isLow: Number(item.quantity || 0) <= Number(item.minStock || 0)
  })));
});

app.post('/api/stock', ensureSession, (req, res) => {
  const data = readData();
  const { name, quantity, unit, packetSize, minStock, supplierName, supplierPhone } = req.body || {};

  if (!name || !quantity) {
    return res.status(400).json({ success: false, message: 'Item name and quantity are required.' });
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a valid positive number.' });
  }

  const existing = data.inventory.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + qty;
    existing.unit = unit || existing.unit;
    existing.packetSize = packetSize || existing.packetSize || '';
    existing.minStock = Number(minStock || existing.minStock || 0);
    existing.supplierName = supplierName || existing.supplierName || '';
    existing.supplierPhone = supplierPhone || existing.supplierPhone || '';
    existing.stockHistory.push({
      date: getTodayDate(),
      action: 'manual_add',
      quantity: qty,
      resultingStock: existing.quantity
    });
    data.transactions.push({
      id: generateId('tx'),
      date: getTodayDate(),
      type: 'stock_add',
      item: existing.name,
      quantity: qty,
      unit: existing.unit
    });
    writeData(data);
    return res.json({ success: true, message: `${existing.name} stock updated by ${qty} ${unit || existing.unit}.` });
  }

  const newItem = {
    id: generateId('item'),
    name: name.trim(),
    quantity: qty,
    unit: unit || 'units',
    minStock: Number(minStock || 0),
    packetSize: packetSize || '',
    supplierName: supplierName || '',
    supplierPhone: supplierPhone || '',
    unitPrice: 0,
    stockHistory: [{
      date: getTodayDate(),
      action: 'manual_add',
      quantity: qty,
      resultingStock: qty
    }]
  };
  data.inventory.push(newItem);
  data.transactions.push({
    id: generateId('tx'),
    date: getTodayDate(),
    type: 'stock_add',
    item: newItem.name,
    quantity: qty,
    unit: newItem.unit
  });
  writeData(data);
  return res.json({ success: true, message: `${newItem.name} added to inventory.` });
});

app.post('/api/customers', ensureSession, (req, res) => {
  const data = readData();
  const { name, phone, address } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Customer name is required.' });
  }

  if (data.customers.some((customer) => customer.name.toLowerCase() === String(name).trim().toLowerCase())) {
    return res.status(400).json({ success: false, message: 'A customer with that name already exists.' });
  }

  const customer = {
    id: generateId('cust'),
    name: String(name).trim(),
    phone: phone || '',
    address: address || '',
    balance: 0,
    transactions: []
  };

  data.customers.push(customer);
  writeData(data);
  res.json({ success: true, message: `Customer ${customer.name} added.` });
});

app.post('/api/udhaar', ensureSession, (req, res) => {
  const data = readData();
  const { customerName, itemName, quantity, unit, amount } = req.body || {};
  if (!customerName || !itemName || !quantity) {
    return res.status(400).json({ success: false, message: 'Customer, item, and quantity are required.' });
  }

  const customerMatches = getCustomerByName(data, customerName);
  if (customerMatches.length > 1) {
    return res.status(400).json({ success: false, message: 'Multiple customers share that name. Please clarify.' });
  }

  if (customerMatches.length === 0) {
    return res.status(400).json({ success: false, message: `Customer "${customerName}" not found.` });
  }

  const item = getItemByName(data, itemName);
  if (!item) {
    return res.status(400).json({ success: false, message: `Item "${itemName}" is not in stock.` });
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be valid.' });
  }

  if (item.quantity < qty) {
    return res.status(400).json({ success: false, message: `Only ${item.quantity} ${item.unit} of ${item.name} are available.` });
  }

  const totalAmount = Number(amount || item.unitPrice * qty || 0);
  item.quantity -= qty;
  item.stockHistory.push({
    date: getTodayDate(),
    action: 'credit_manual',
    quantity: qty,
    resultingStock: item.quantity
  });

  const customer = customerMatches[0];
  customer.balance = Number(customer.balance || 0) + totalAmount;
  customer.transactions.push({
    date: getTodayDate(),
    type: 'credit',
    item: item.name,
    quantity: qty,
    unit: unit || item.unit,
    amount: totalAmount,
    note: 'Manual credit entry'
  });

  data.transactions.push({
    id: generateId('tx'),
    date: getTodayDate(),
    type: 'credit',
    customer: customer.name,
    item: item.name,
    quantity: qty,
    unit: unit || item.unit,
    amount: totalAmount
  });
  writeData(data);

  res.json({ success: true, message: `${qty} ${unit || item.unit} of ${item.name} added to ${customer.name}'s udhaar.` });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Kirana Chat Ledger running on http://localhost:${port}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log('Gemini API key missing. Add GEMINI_API_KEY to .env for AI parsing.');
  }
});
