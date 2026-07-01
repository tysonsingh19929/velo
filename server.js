const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON body parsers
app.use(cors());
app.use(express.json());

// Database Paths (Fallback File persistence)
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const SELLERS_FILE = path.join(__dirname, 'data', 'sellers.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// ==========================================
// 1. MONGODB ATLAS / SCHEMAS CONNECTION
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI;
let useMongoDB = false;

// Define Schemas
const SellerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  commissionRate: { type: Number, default: 5.0 },
  fixedRent: { type: Number, default: 100.00 },
  status: { type: String, default: 'pending' },
  sales: { type: Number, default: 0.00 },
  referralCode: { type: String, default: '' }
});

const ProductSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  weight: { type: String, required: true },
  rating: { type: Number, default: 4.8 },
  bestseller: { type: Boolean, default: false },
  tagLabel: { type: String, default: 'Direct Sourced' },
  image: { type: String, required: true },
  sellerId: { type: String, required: true }
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  items: { type: Array, required: true },
  payoutAmount: { type: Number, required: true },
  hubNode: { type: String, required: true },
  address: { type: String, required: true },
  eta: { type: String, required: true },
  distance: { type: String, required: true },
  status: { type: String, default: 'Dispatched' },
  date: { type: String, required: true }
});

const Seller = mongoose.model('Seller', SellerSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  walletBalance: { type: Number, default: 140.00 },
  points: { type: Number, default: 340 },
  referrals: { type: Number, default: 4 },
  orderHistory: { type: Array, default: [] }
});

const User = mongoose.model('User', UserSchema);

// Memory database storage for users in JSON file fallback
const USERS_FILE = path.join(__dirname, 'data', 'users.json');


if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('Connected to real MongoDB Atlas cluster database!');
      useMongoDB = true;
      await seedMongoDatabase();
    })
    .catch(err => {
      console.error('MongoDB Atlas connection failed. Falling back to JSON database files:', err);
    });
} else {
  console.log('No MONGODB_URI detected in environment. Running on persistent JSON database files.');
}

// Seed MongoDB with initial records if collections are empty
async function seedMongoDatabase() {
  try {
    const sellerCount = await Seller.countDocuments();
    if (sellerCount === 0) {
      const fileSellers = readData(SELLERS_FILE);
      if (fileSellers.length > 0) {
        await Seller.insertMany(fileSellers);
        console.log('Seeded Sellers to MongoDB from JSON backup.');
      }
    }
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const fileProducts = readData(PRODUCTS_FILE);
      if (fileProducts.length > 0) {
        await Product.insertMany(fileProducts);
        console.log('Seeded Products to MongoDB from JSON backup.');
      }
    }
  } catch (err) {
    console.error('Error seeding MongoDB collection hooks:', err);
  }
}

// ==========================================
// JSON File DB Helpers (Fallback persistence)
// ==========================================
function readData(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('JSON Database write error:', error);
  }
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. PRODUCTS API
// GET all active products (excludes suspended sellers)
app.get('/api/products', async (req, res) => {
  if (useMongoDB) {
    try {
      const activeSellers = await Seller.find({ status: 'active' });
      const activeIds = activeSellers.map(s => s.id);
      const activeProducts = await Product.find({ sellerId: { $in: activeIds } });
      return res.json(activeProducts);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback
  const products = readData(PRODUCTS_FILE);
  const sellers = readData(SELLERS_FILE);
  const suspendedIds = sellers.filter(s => s.status === 'suspended').map(s => s.id);
  const activeProducts = products.filter(p => !suspendedIds.includes(p.sellerId));
  res.json(activeProducts);
});

// GET master products list (for Admin)
app.get('/api/products/master', async (req, res) => {
  if (useMongoDB) {
    try {
      const products = await Product.find();
      return res.json(products);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback
  const products = readData(PRODUCTS_FILE);
  res.json(products);
});

// POST Add new product
app.post('/api/products', async (req, res) => {
  const newProd = req.body;

  if (useMongoDB) {
    try {
      const maxProd = await Product.findOne().sort({ id: -1 });
      const nextId = maxProd ? maxProd.id + 1 : 1;
      newProd.id = nextId;
      newProd.rating = parseFloat((4.5 + Math.random() * 0.5).toFixed(1));
      newProd.bestseller = false;

      const created = await Product.create(newProd);
      return res.status(201).json(created);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Fallback
  const products = readData(PRODUCTS_FILE);
  const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  newProd.id = nextId;
  newProd.rating = parseFloat((4.5 + Math.random() * 0.5).toFixed(1));
  newProd.bestseller = false;
  products.push(newProd);
  writeData(PRODUCTS_FILE, products);
  res.status(201).json(newProd);
});

// PUT Update product details
app.put('/api/products/:id', async (req, res) => {
  const prodId = parseInt(req.params.id);
  const updatedData = req.body;

  if (useMongoDB) {
    try {
      const updated = await Product.findOneAndUpdate({ id: prodId }, updatedData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Product not found.' });
      return res.json(updated);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Fallback
  const products = readData(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === prodId);
  if (idx === -1) return res.status(404).json({ error: 'Product not found.' });
  products[idx] = { ...products[idx], ...updatedData };
  writeData(PRODUCTS_FILE, products);
  res.json(products[idx]);
});

// DELETE Product
app.delete('/api/products/:id', async (req, res) => {
  const prodId = parseInt(req.params.id);

  if (useMongoDB) {
    try {
      const deleted = await Product.findOneAndDelete({ id: prodId });
      if (!deleted) return res.status(404).json({ error: 'Product not found.' });
      return res.json({ success: true, message: 'Product listing deleted.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback
  let products = readData(PRODUCTS_FILE);
  const exist = products.some(p => p.id === prodId);
  if (!exist) return res.status(404).json({ error: 'Product not found.' });
  products = products.filter(p => p.id !== prodId);
  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product listing deleted.' });
});


// 2. SELLERS API
// GET all sellers
app.get('/api/sellers', async (req, res) => {
  if (useMongoDB) {
    try {
      const sellers = await Seller.find();
      return res.json(sellers);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback
  const sellers = readData(SELLERS_FILE);
  res.json(sellers);
});

// POST Add new seller
app.post('/api/sellers', async (req, res) => {
  const newSeller = req.body;

  if (useMongoDB) {
    try {
      const emailExist = await Seller.findOne({ email: newSeller.email.toLowerCase() });
      if (emailExist) return res.status(400).json({ error: 'Email address already registered.' });

      const allSellers = await Seller.find();
      const nextIdNum = allSellers.length > 0 ? Math.max(...allSellers.map(s => parseInt(s.id.split('-')[1]))) + 1 : 101;
      newSeller.id = `S-${nextIdNum}`;
      newSeller.status = 'pending';
      newSeller.sales = 0.00;

      const created = await Seller.create(newSeller);
      return res.status(201).json(created);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Fallback
  const sellers = readData(SELLERS_FILE);
  const emailExist = sellers.some(s => s.email.toLowerCase() === newSeller.email.toLowerCase());
  if (emailExist) return res.status(400).json({ error: 'Email address already registered.' });
  const nextIdNum = sellers.length > 0 ? Math.max(...sellers.map(s => parseInt(s.id.split('-')[1]))) + 1 : 101;
  newSeller.id = `S-${nextIdNum}`;
  newSeller.status = 'pending';
  newSeller.sales = 0.00;
  sellers.push(newSeller);
  writeData(SELLERS_FILE, sellers);
  res.status(201).json(newSeller);
});

// POST Authenticate merchant login
app.post('/api/sellers/login', async (req, res) => {
  const { email, password } = req.body;

  if (useMongoDB) {
    try {
      const match = await Seller.findOne({ email: email.toLowerCase() });
      if (!match) return res.status(404).json({ error: 'Merchant record not found.' });
      if (match.password !== password) return res.status(401).json({ error: 'Incorrect access credentials.' });
      if (match.status === 'pending') return res.status(403).json({ error: 'Registration pending administrator approval.' });
      if (match.status === 'suspended') return res.status(403).json({ error: 'Merchant account is suspended.' });
      return res.json(match);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback
  const sellers = readData(SELLERS_FILE);
  const match = sellers.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (!match) return res.status(404).json({ error: 'Merchant record not found.' });
  if (match.password !== password) return res.status(401).json({ error: 'Incorrect access credentials.' });
  if (match.status === 'pending') return res.status(403).json({ error: 'Registration pending administrator approval.' });
  if (match.status === 'suspended') return res.status(403).json({ error: 'Merchant account is suspended.' });
  res.json(match);
});

// PUT Update seller details
app.put('/api/sellers/:id', async (req, res) => {
  const sellerId = req.params.id;
  const updatedData = req.body;

  if (useMongoDB) {
    try {
      const oldSeller = await Seller.findOne({ id: sellerId });
      if (oldSeller && oldSeller.status === 'pending' && updatedData.status === 'active') {
        // Referral trigger!
        if (oldSeller.referralCode) {
          const code = oldSeller.referralCode;
          // Check if refers customer
          const referringUser = await User.findOne({ phone: code });
          if (referringUser) {
            referringUser.walletBalance = parseFloat((referringUser.walletBalance + 10.00).toFixed(2));
            referringUser.points += 100;
            referringUser.orderHistory.push({
              id: 'REF-' + Math.floor(100000 + Math.random() * 900000),
              payoutAmount: 10.00,
              status: 'Referral Bonus Received',
              date: new Date().toLocaleDateString(),
              items: [{ name: `Merchant referral: S-${sellerId} approved`, price: 10.00, quantity: 1 }]
            });
            await referringUser.save();
            console.log(`[REF] Credited customer +971 ${code} with AED 10 + 100 pts!`);
          } else {
            // Check if refers another seller
            const referringSeller = await Seller.findOne({ id: code });
            if (referringSeller) {
              referringSeller.sales = parseFloat((referringSeller.sales + 50.00).toFixed(2));
              await referringSeller.save();
              console.log(`[REF] Credited seller ${code} with AED 50.00 bonus!`);
            }
          }
        }
      }
      const updated = await Seller.findOneAndUpdate({ id: sellerId }, updatedData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Merchant node not found.' });
      return res.json(updated);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Fallback
  const sellers = readData(SELLERS_FILE);
  const idx = sellers.findIndex(s => s.id === sellerId);
  if (idx === -1) return res.status(404).json({ error: 'Merchant node not found.' });
  
  const oldSeller = sellers[idx];
  if (oldSeller.status === 'pending' && updatedData.status === 'active') {
    if (oldSeller.referralCode) {
      const code = oldSeller.referralCode;
      const users = readData(USERS_FILE);
      const userIdx = users.findIndex(u => u.phone === code);
      if (userIdx !== -1) {
        users[userIdx].walletBalance = parseFloat((users[userIdx].walletBalance + 10.00).toFixed(2));
        users[userIdx].points += 100;
        users[userIdx].orderHistory.push({
          id: 'REF-' + Math.floor(100000 + Math.random() * 900000),
          payoutAmount: 10.00,
          status: 'Referral Bonus Received',
          date: new Date().toLocaleDateString(),
          items: [{ name: `Merchant referral: S-${sellerId} approved`, price: 10.00, quantity: 1 }]
        });
        writeData(USERS_FILE, users);
        console.log(`[FILE REF] Credited customer +971 ${code} with AED 10 + 100 pts!`);
      } else {
        const refSellerIdx = sellers.findIndex(s => s.id === code);
        if (refSellerIdx !== -1) {
          sellers[refSellerIdx].sales = parseFloat((sellers[refSellerIdx].sales + 50.00).toFixed(2));
          console.log(`[FILE REF] Credited seller ${code} with AED 50.00 bonus!`);
        }
      }
    }
  }
  
  sellers[idx] = { ...sellers[idx], ...updatedData };
  writeData(SELLERS_FILE, sellers);
  res.json(sellers[idx]);
});

// DELETE Seller
app.delete('/api/sellers/:id', async (req, res) => {
  const sellerId = req.params.id;

  if (useMongoDB) {
    try {
      const deleted = await Seller.findOneAndDelete({ id: sellerId });
      if (!deleted) return res.status(404).json({ error: 'Merchant node not found.' });
      
      // Delete associated products
      await Product.deleteMany({ sellerId: sellerId });
      return res.json({ success: true, message: 'Merchant node deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback
  let sellers = readData(SELLERS_FILE);
  const exist = sellers.some(s => s.id === sellerId);
  if (!exist) return res.status(404).json({ error: 'Merchant node not found.' });
  sellers = sellers.filter(s => s.id !== sellerId);
  writeData(SELLERS_FILE, sellers);
  let products = readData(PRODUCTS_FILE);
  products = products.filter(p => p.sellerId !== sellerId);
  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Merchant node deleted successfully.' });
});


// 3. ORDERS API
// GET all orders
app.get('/api/orders', async (req, res) => {
  if (useMongoDB) {
    try {
      const orders = await Order.find();
      return res.json(orders);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  const orders = readData(ORDERS_FILE);
  res.json(orders);
});

// POST Create checkout order
app.post('/api/orders', async (req, res) => {
  const order = req.body;

  if (useMongoDB) {
    try {
      const created = await Order.create(order);
      // Increment sales for each matching merchant
      for (const cartItem of order.items) {
        await Seller.findOneAndUpdate(
          { id: cartItem.sellerId },
          { $inc: { sales: cartItem.price * cartItem.quantity } }
        );
      }
      // Link to user if phone is provided
      if (order.userPhone) {
        await User.findOneAndUpdate(
          { phone: order.userPhone },
          { $push: { orderHistory: order } }
        );
      }
      return res.status(201).json({ success: true, orderId: created.id });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Fallback
  const orders = readData(ORDERS_FILE);
  const sellers = readData(SELLERS_FILE);
  orders.push(order);
  writeData(ORDERS_FILE, orders);
  order.items.forEach(cartItem => {
    const idx = sellers.findIndex(s => s.id === cartItem.sellerId);
    if (idx !== -1) {
      sellers[idx].sales = parseFloat((sellers[idx].sales + (cartItem.price * cartItem.quantity)).toFixed(2));
    }
  });
  writeData(SELLERS_FILE, sellers);
  // Link to user in local fallback
  if (order.userPhone) {
    const users = readData(USERS_FILE);
    const userIdx = users.findIndex(u => u.phone === order.userPhone);
    if (userIdx !== -1) {
      users[userIdx].orderHistory.push(order);
      writeData(USERS_FILE, users);
    }
  }
  res.status(201).json({ success: true, orderId: order.id });
});



// ==========================================
// 4. USER AUTH & CUSTOMER ACCOUNT ROUTING
// ==========================================

// Mock OTP storage in memory
const activeOtps = {};

// POST generate and dispatch mock OTP
app.post('/api/users/otp/send', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Mobile number is required.' });

  const mockCode = '123456'; // standard mock verification code
  activeOtps[phone] = mockCode;

  console.log(`[AUTH SERVER] Dispatched mock code ${mockCode} to customer mobile: +971 ${phone}`);
  res.json({ success: true, message: 'Verification code dispatched.', code: mockCode });
});

// POST verify OTP and retrieve/register user profile
app.post('/api/users/otp/verify', async (req, res) => {
  const { phone, email, code } = req.body;
  if (!phone || !email || !code) {
    return res.status(400).json({ error: 'Phone, email, and verification code are required.' });
  }

  const matchCode = activeOtps[phone];
  if (!matchCode || matchCode !== code) {
    return res.status(400).json({ error: 'Incorrect verification code.' });
  }

  // Clear OTP from memory cache
  delete activeOtps[phone];

  if (useMongoDB) {
    try {
      let customer = await User.findOne({ phone });
      if (!customer) {
        // Register new customer
        customer = await User.create({ phone, email });
        console.log(`[DB MASTER] Registered new customer node: +971 ${phone}`);
      }
      return res.json(customer);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Local JSON File Fallback
  const users = readData(USERS_FILE);
  let customer = users.find(u => u.phone === phone);
  if (!customer) {
    customer = {
      phone,
      email,
      walletBalance: 140.00,
      points: 340,
      referrals: 4,
      orderHistory: []
    };
    users.push(customer);
    writeData(USERS_FILE, users);
    console.log(`[FILE BACKUP] Registered new customer locally: +971 ${phone}`);
  }
  res.json(customer);
});

// GET Fetch user details by phone
app.get('/api/users/:phone', async (req, res) => {
  const { phone } = req.params;

  if (useMongoDB) {
    try {
      const customer = await User.findOne({ phone });
      if (!customer) return res.status(404).json({ error: 'User profile not found.' });
      return res.json(customer);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback
  const users = readData(USERS_FILE);
  const customer = users.find(u => u.phone === phone);
  if (!customer) return res.status(404).json({ error: 'User profile not found.' });
  res.json(customer);
});

// PUT Deduct wallet or add points
app.put('/api/users/:phone/wallet', async (req, res) => {
  const { phone } = req.params;
  const { deductAmount, addPoints } = req.body;

  if (useMongoDB) {
    try {
      const updateObj = {};
      if (deductAmount !== undefined) updateObj.$inc = { walletBalance: -parseFloat(deductAmount) };
      if (addPoints !== undefined) {
        if (!updateObj.$inc) updateObj.$inc = {};
        updateObj.$inc.points = parseInt(addPoints);
      }

      const updated = await User.findOneAndUpdate({ phone }, updateObj, { new: true });
      if (!updated) return res.status(404).json({ error: 'User profile not found.' });
      return res.json(updated);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Fallback
  const users = readData(USERS_FILE);
  const idx = users.findIndex(u => u.phone === phone);
  if (idx === -1) return res.status(404).json({ error: 'User profile not found.' });

  if (deductAmount !== undefined) {
    users[idx].walletBalance = parseFloat((users[idx].walletBalance - parseFloat(deductAmount)).toFixed(2));
  }
  if (addPoints !== undefined) {
    users[idx].points += parseInt(addPoints);
  }

  writeData(USERS_FILE, users);
  res.json(users[idx]);
});

// ==========================================
// STATIC PORTAL ROUTING
// ==========================================
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server listeners
app.listen(PORT, () => {
  console.log(`VeloResell Unified Server running on port ${PORT}...`);
});
