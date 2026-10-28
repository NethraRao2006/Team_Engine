const state = {
  isLoggedIn: false,
  activeView: 'chat',
  inventory: [],
  customers: [],
  chatHistory: [],
  reports: {},
  selectedCustomerId: null
};

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const aiStatus = document.getElementById('ai-status');

function setMessage(el, text, type = '') {
  if (!el) return;
  el.className = `message-box ${type}`.trim();
  el.textContent = text;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

async function checkSession() {
  try {
    const result = await apiRequest('/api/session');
    state.isLoggedIn = Boolean(result.loggedIn);
    showLoginState();
    if (state.isLoggedIn) {
      await loadDashboard();
    }
  } catch (error) {
    console.error(error);
    state.isLoggedIn = false;
    showLoginState();
  }
}

function showLoginState() {
  if (state.isLoggedIn) {
    loginScreen.classList.add('hidden');
    loginScreen.classList.remove('active');
    appShell.classList.remove('hidden');
    appShell.classList.add('active');
  } else {
    loginScreen.classList.remove('hidden');
    loginScreen.classList.add('active');
    appShell.classList.add('hidden');
    appShell.classList.remove('active');
  }
}

async function loadDashboard() {
  await Promise.all([loadInventory(), loadCustomers(), loadChatHistory(), loadReports(), checkAiStatus()]);
  renderActiveView();
}

async function loadInventory() {
  state.inventory = await apiRequest('/api/inventory');
  renderInventory();
  renderStock();
}

async function loadCustomers() {
  state.customers = await apiRequest('/api/customers');
  if (!state.selectedCustomerId && state.customers.length) {
    state.selectedCustomerId = state.customers[0].id;
  }
  renderCustomers();
  renderCustomerDetails();
}

async function loadChatHistory() {
  const history = await apiRequest('/api/chat-history');
  state.chatHistory = history;
  renderChatHistory();
}

async function loadReports() {
  state.reports = await apiRequest('/api/reports');
  renderReports();
}

async function checkAiStatus() {
  try {
    const health = await apiRequest('/api/health');
    aiStatus.textContent = health.geminiConfigured ? 'AI: Gemini ready' : 'AI: demo fallback mode';
  } catch (error) {
    aiStatus.textContent = 'AI: unavailable';
  }
}

function renderChatHistory() {
  if (!chatMessages) return;
  chatMessages.innerHTML = '';
  state.chatHistory.forEach((item) => {
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${item.role === 'shopkeeper' ? 'customer' : 'assistant'}`;
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = item.text;
    messageRow.appendChild(bubble);
    chatMessages.appendChild(messageRow);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderInventory() {
  const inventoryList = document.getElementById('inventory-list');
  if (!inventoryList) return;

  inventoryList.innerHTML = '';
  state.inventory.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'inventory-card';
    const low = Number(item.quantity || 0) <= Number(item.minStock || 0);
    card.innerHTML = `
      <div class="inventory-header">
        <h3>${item.name}</h3>
        <span class="status ${low ? 'warning' : 'ok'}">${low ? 'Low stock' : 'In stock'}</span>
      </div>
      <p>Qty: <strong>${item.quantity}</strong> ${item.unit}</p>
      <p>Min stock: ${item.minStock}</p>
      <p>Supplier: ${item.supplierName || 'Not set'}</p>
      <p>Packet size: ${item.packetSize || '—'}</p>
    `;
    inventoryList.appendChild(card);
  });
}

function renderCustomers() {
  const container = document.getElementById('customer-list');
  if (!container) return;

  container.innerHTML = '';
  state.customers.forEach((customer) => {
    const item = document.createElement('div');
    item.className = `customer-item ${customer.id === state.selectedCustomerId ? 'selected' : ''}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'customer-name';
    button.textContent = customer.name;
    button.addEventListener('click', () => {
      state.selectedCustomerId = customer.id;
      renderCustomers();
      renderCustomerDetails();
    });
    const balance = document.createElement('span');
    balance.className = 'customer-balance';
    balance.textContent = `₹${Number(customer.balance || 0)}`;
    item.appendChild(button);
    item.appendChild(balance);
    container.appendChild(item);
  });
}

function renderCustomerDetails() {
  const details = document.getElementById('customer-details');
  if (!details) return;

  const selected = state.customers.find((customer) => customer.id === state.selectedCustomerId) || state.customers[0];

  if (!selected) {
    details.innerHTML = '<p>No customer selected.</p>';
    return;
  }

  details.innerHTML = `
    <div class="customer-card">
      <h4>${selected.name}</h4>
      <p><strong>Phone:</strong> ${selected.phone || '—'}</p>
      <p><strong>Address:</strong> ${selected.address || '—'}</p>
      <p><strong>Outstanding:</strong> ₹${Number(selected.balance || 0)}</p>
      <button type="button" class="primary-btn add-udhaar-btn">+ Add Udhaar</button>
    </div>
    <div class="transaction-stack">
      ${selected.transactions.length ? selected.transactions.map((entry) => `
        <div class="transaction-item">
          <span>${entry.date}</span>
          <span>${entry.type}</span>
          <span>${entry.item || 'Payment'}</span>
          <strong>₹${Number(entry.amount || 0)}</strong>
        </div>
      `).join('') : '<p>No recent transactions.</p>'}
    </div>
  `;

  const addButton = details.querySelector('.add-udhaar-btn');
  if (addButton) {
    addButton.addEventListener('click', () => showUdhaarForm(selected));
  }
}

function showCustomerForm() {
  const details = document.getElementById('customer-details');
  if (!details) return;

  details.innerHTML = `
    <form id="new-customer-form" class="inline-form">
      <h4>Add Customer</h4>
      <label>
        Name
        <input type="text" id="customer-name" required />
      </label>
      <label>
        Phone
        <input type="text" id="customer-phone" />
      </label>
      <label>
        Address
        <input type="text" id="customer-address" />
      </label>
      <div class="submit-row">
        <button type="submit" class="primary-btn">Save</button>
        <button type="button" id="cancel-customer-form" class="secondary-btn">Cancel</button>
      </div>
    </form>
  `;

  details.querySelector('#new-customer-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const address = document.getElementById('customer-address').value;
    try {
      await apiRequest('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ name, phone, address })
      });
      await loadCustomers();
    } catch (error) {
      alert(error.message);
    }
  });

  details.querySelector('#cancel-customer-form').addEventListener('click', () => renderCustomerDetails());
}

function showUdhaarForm(customer) {
  const details = document.getElementById('customer-details');
  if (!details) return;

  details.innerHTML = `
    <form id="new-udhaar-form" class="inline-form">
      <h4>Add Udhaar for ${customer.name}</h4>
      <label>
        Item
        <input type="text" id="udhaar-item" required />
      </label>
      <label>
        Quantity
        <input type="number" id="udhaar-quantity" min="1" required />
      </label>
      <label>
        Unit
        <input type="text" id="udhaar-unit" placeholder="bags, packets" />
      </label>
      <label>
        Amount
        <input type="number" id="udhaar-amount" min="0" step="1" />
      </label>
      <div class="submit-row">
        <button type="submit" class="primary-btn">Save</button>
        <button type="button" id="cancel-udhaar-form" class="secondary-btn">Cancel</button>
      </div>
    </form>
  `;

  details.querySelector('#new-udhaar-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      customerName: customer.name,
      itemName: document.getElementById('udhaar-item').value,
      quantity: document.getElementById('udhaar-quantity').value,
      unit: document.getElementById('udhaar-unit').value,
      amount: document.getElementById('udhaar-amount').value
    };

    try {
      await apiRequest('/api/udhaar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await Promise.all([loadCustomers(), loadInventory(), loadReports()]);
      renderCustomerDetails();
    } catch (error) {
      alert(error.message);
    }
  });

  details.querySelector('#cancel-udhaar-form').addEventListener('click', () => renderCustomerDetails());
}

function renderStock() {
  const container = document.getElementById('stock-list');
  if (!container) return;

  container.innerHTML = '';
  state.inventory.forEach((item) => {
    const row = document.createElement('div');
    row.className = `stock-row ${Number(item.quantity || 0) <= Number(item.minStock || 0) ? 'low' : ''}`;
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>${item.quantity} ${item.unit}</span>
      </div>
      <div>
        <small>${Number(item.quantity || 0) <= Number(item.minStock || 0) ? 'Low stock' : 'Healthy'}</small>
      </div>
      <div class="row-actions">
        <button type="button" class="secondary-btn reorder-btn" data-item="${item.name}">Reorder</button>
      </div>
    `;
    const reorderBtn = row.querySelector('.reorder-btn');
    reorderBtn.addEventListener('click', () => {
      const qty = Math.max(10, Number(item.minStock || 0) * 2 || 10);
      const message = `Hello, please send ${qty} ${item.name.toLowerCase()} ${item.unit} today. Please confirm availability. Thank you.`;
      const supplier = item.supplierPhone ? `https://wa.me/${item.supplierPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}` : '';
      if (supplier) {
        window.open(supplier, '_blank');
      }
      alert(message);
    });
    container.appendChild(row);
  });
}

function renderReports() {
  const summary = document.getElementById('reports-summary');
  const list = document.getElementById('recent-transactions');
  if (!summary || !list) return;

  summary.innerHTML = `
    <div class="summary-card">
      <span>Total stock</span>
      <strong>${state.reports.totalStock || 0}</strong>
    </div>
    <div class="summary-card">
      <span>Customers</span>
      <strong>${state.reports.totalCustomers || 0}</strong>
    </div>
    <div class="summary-card">
      <span>Outstanding</span>
      <strong>₹${Number(state.reports.outstanding || 0)}</strong>
    </div>
  `;

  list.innerHTML = '';
  const recent = state.reports.recentTransactions || [];
  recent.forEach((txn) => {
    const row = document.createElement('div');
    row.className = 'transaction-row';
    row.innerHTML = `
      <span>${txn.date}</span>
      <span>${txn.type}</span>
      <span>${txn.customer || txn.item || '—'}</span>
      <strong>₹${Number(txn.amount || 0)}</strong>
    `;
    list.appendChild(row);
  });
}

function renderActiveView() {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const isActive = button.dataset.view === state.activeView;
    button.classList.toggle('active', isActive);
  });

  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('active', view.id === `view-${state.activeView}`);
  });
}

function bindNavigation() {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeView = button.dataset.view;
      renderActiveView();
    });
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const result = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (result.success) {
      state.isLoggedIn = true;
      setMessage(loginMessage, result.message, 'success');
      showLoginState();
      await loadDashboard();
    }
  } catch (error) {
    setMessage(loginMessage, error.message, 'warning');
  }
});

document.getElementById('logout-button').addEventListener('click', async () => {
  try {
    await apiRequest('/api/logout', { method: 'POST' });
    state.isLoggedIn = false;
    showLoginState();
  } catch (error) {
    console.error(error);
  }
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  try {
    await apiRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    chatInput.value = '';
    await loadChatHistory();
    await loadInventory();
    await loadCustomers();
    await loadReports();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('add-customer-btn').addEventListener('click', showCustomerForm);
document.getElementById('add-stock-btn').addEventListener('click', () => {
  document.getElementById('stock-form').classList.remove('hidden');
});
document.getElementById('cancel-stock-form').addEventListener('click', () => {
  document.getElementById('stock-form').classList.add('hidden');
  document.getElementById('stock-form').reset();
});

document.getElementById('stock-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: document.getElementById('stock-name').value,
    quantity: document.getElementById('stock-quantity').value,
    unit: document.getElementById('stock-unit').value,
    packetSize: document.getElementById('stock-packet-size').value,
    minStock: document.getElementById('stock-min').value,
    supplierName: document.getElementById('stock-supplier-name').value,
    supplierPhone: document.getElementById('stock-supplier-phone').value
  };

  try {
    await apiRequest('/api/stock', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    document.getElementById('stock-form').reset();
    document.getElementById('stock-form').classList.add('hidden');
    await loadInventory();
    await loadReports();
  } catch (error) {
    alert(error.message);
  }
});

bindNavigation();
checkSession();
