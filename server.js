const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON body parsers
app.use(cors());
app.use(express.json());

// Database Paths
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const SELLERS_FILE = path.join(__dirname, 'data', 'sellers.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// File DB Helper Functions
function readData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading database file at ${filePath}:`, error);
    return [];
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing database file at ${filePath}:`, error);
  }
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. PRODUCTS ROUTING
// GET all active products (filters out items belonging to suspended sellers)
app.get('/api/products', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  const sellers = readData(SELLERS_FILE);
  const suspendedIds = sellers.filter(s => s.status === 'suspended').map(s => s.id);
  
  const activeProducts = products.filter(p => !suspendedIds.includes(p.sellerId));
  res.json(activeProducts);
});

// GET all products (Master list for Admin Console)
app.get('/api/products/master', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  res.json(products);
});

// POST Add new product listing
app.post('/api/products', (req, res) => {
  const newProd = req.body;
  const products = readData(PRODUCTS_FILE);
  
  const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  newProd.id = nextId;
  newProd.rating = parseFloat((4.5 + Math.random() * 0.5).toFixed(1));
  newProd.bestseller = false;

  products.push(newProd);
  writeData(PRODUCTS_FILE, products);

  res.status(201).json(newProd);
});

// PUT Override product details (Admin/Seller Edit)
app.put('/api/products/:id', (req, res) => {
  const prodId = parseInt(req.params.id);
  const updatedData = req.body;
  const products = readData(PRODUCTS_FILE);

  const idx = products.findIndex(p => p.id === prodId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  // Update allowed fields
  products[idx] = { ...products[idx], ...updatedData };
  writeData(PRODUCTS_FILE, products);

  res.json(products[idx]);
});

// DELETE Product listing
app.delete('/api/products/:id', (req, res) => {
  const prodId = parseInt(req.params.id);
  let products = readData(PRODUCTS_FILE);

  const exist = products.some(p => p.id === prodId);
  if (!exist) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  products = products.filter(p => p.id !== prodId);
  writeData(PRODUCTS_FILE, products);

  res.json({ success: true, message: 'Product listing deleted.' });
});


// 2. SELLERS ROUTING
// GET all registered sellers (Admin stats overview)
app.get('/api/sellers', (req, res) => {
  const sellers = readData(SELLERS_FILE);
  res.json(sellers);
});

// POST Add new seller node (Admin configuration)
app.post('/api/sellers', (req, res) => {
  const newSeller = req.body;
  const sellers = readData(SELLERS_FILE);

  // Check email redundancy
  const emailExist = sellers.some(s => s.email.toLowerCase() === newSeller.email.toLowerCase());
  if (emailExist) {
    return res.status(400).json({ error: 'Email address already registered.' });
  }

  const nextIdNum = sellers.length > 0 ? Math.max(...sellers.map(s => parseInt(s.id.split('-')[1]))) + 1 : 101;
  newSeller.id = `S-${nextIdNum}`;
  newSeller.status = 'active';
  newSeller.sales = 0.00;

  sellers.push(newSeller);
  writeData(SELLERS_FILE, sellers);

  res.status(201).json(newSeller);
});

// POST Authenticate merchant credentials
app.post('/api/sellers/login', (req, res) => {
  const { email, password } = req.body;
  const sellers = readData(SELLERS_FILE);

  const match = sellers.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (!match) {
    return res.status(404).json({ error: 'Merchant record not found.' });
  }

  if (match.password !== password) {
    return res.status(401).json({ error: 'Incorrect access credentials.' });
  }

  if (match.status === 'suspended') {
    return res.status(403).json({ error: 'Merchant account is suspended.' });
  }

  res.json(match);
});

// PUT Update seller configurations (Password change, suspension toggling, rent adjust)
app.put('/api/sellers/:id', (req, res) => {
  const sellerId = req.params.id;
  const updatedData = req.body;
  const sellers = readData(SELLERS_FILE);

  const idx = sellers.findIndex(s => s.id === sellerId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Merchant node not found.' });
  }

  sellers[idx] = { ...sellers[idx], ...updatedData };
  writeData(SELLERS_FILE, sellers);

  res.json(sellers[idx]);
});

// DELETE Seller node
app.delete('/api/sellers/:id', (req, res) => {
  const sellerId = req.params.id;
  let sellers = readData(SELLERS_FILE);

  const exist = sellers.some(s => s.id === sellerId);
  if (!exist) {
    return res.status(404).json({ error: 'Merchant node not found.' });
  }

  sellers = sellers.filter(s => s.id !== sellerId);
  writeData(SELLERS_FILE, sellers);

  // Clear products belonging to this seller
  let products = readData(PRODUCTS_FILE);
  products = products.filter(p => p.sellerId !== sellerId);
  writeData(PRODUCTS_FILE, products);

  res.json({ success: true, message: 'Merchant node deleted successfully.' });
});


// 3. ORDERS ROUTING
// POST Submit customer order, incrementing merchant sales statistics
app.post('/api/orders', (req, res) => {
  const order = req.body; // Contains cart array
  const orders = readData(ORDERS_FILE);
  const sellers = readData(SELLERS_FILE);

  // Record order
  orders.push(order);
  writeData(ORDERS_FILE, orders);

  // Increment sales ledger for matching merchants
  order.items.forEach(cartItem => {
    const idx = sellers.findIndex(s => s.id === cartItem.sellerId);
    if (idx !== -1) {
      sellers[idx].sales = parseFloat((sellers[idx].sales + (cartItem.price * cartItem.quantity)).toFixed(2));
    }
  });
  
  writeData(SELLERS_FILE, sellers);

  res.status(201).json({ success: true, orderId: order.id });
});


// ==========================================
// STATIC PORTAL ROUTING
// ==========================================
// Serves landing page index.html at root, and subfolders user-site/, seller/, admin/
app.use(express.static(__dirname));

// Direct unknown fallback paths to the landing page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server listeners
app.listen(PORT, () => {
  console.log(`VeloResell Unified Server running on port ${PORT}...`);
});
