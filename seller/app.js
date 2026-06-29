document.addEventListener('DOMContentLoaded', () => {

  // Global Notification/Toast System
  function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Database Load Helpers with API integrations
  let productsCache = [];
  let sellersCache = [];

  async function fetchBackendData() {
    try {
      const resProds = await fetch('/api/products/master');
      const resSellers = await fetch('/api/sellers');
      if (resProds.ok && resProds.headers.get("content-type")?.includes("application/json")) {
        productsCache = await resProds.json();
      } else {
        throw new Error("Invalid response type");
      }
      if (resSellers.ok && resSellers.headers.get("content-type")?.includes("application/json")) {
        sellersCache = await resSellers.json();
      } else {
        throw new Error("Invalid response type");
      }
    } catch (e) {
      console.warn("Backend offline. Loading mock databases from LocalStorage.", e);
      productsCache = JSON.parse(localStorage.getItem('velo_products')) || [];
      sellersCache = JSON.parse(localStorage.getItem('velo_sellers')) || [];
    }
  }

  function getSellers() {
    return sellersCache;
  }
  function getProducts() {
    return productsCache;
  }

  // State
  let activeSeller = null;
  let editingProductId = null;

  // DOM Elements
  const loginSection = document.getElementById('login-section');
  const portalSection = document.getElementById('portal-section');
  const btnLogin = document.getElementById('btn-login');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');

  const lblMerchantName = document.getElementById('lbl-merchant-name');
  const lblMerchantId = document.getElementById('lbl-merchant-id');
  const btnLogout = document.getElementById('btn-logout');

  // Navigation Links & Views
  const viewDashboard = document.getElementById('view-dashboard');
  const viewInventory = document.getElementById('view-inventory');
  const viewFinances = document.getElementById('view-finances');

  const linkDashboard = document.getElementById('link-dashboard');
  const linkInventory = document.getElementById('link-inventory');
  const linkFinances = document.getElementById('link-finances');

  function switchPortalView(viewId, activeLink) {
    [viewDashboard, viewInventory, viewFinances].forEach(view => view.classList.add('hidden'));
    [linkDashboard, linkInventory, linkFinances].forEach(link => link.classList.remove('active'));

    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    activeLink.classList.add('active');

    const workspaceTitle = document.getElementById('workspace-title');
    if (viewId === 'dashboard') workspaceTitle.textContent = 'Overview Stats';
    if (viewId === 'inventory') workspaceTitle.textContent = 'Inventory Manager';
    if (viewId === 'finances') workspaceTitle.textContent = 'Commission Statements';
  }

  linkDashboard.addEventListener('click', (e) => { e.preventDefault(); switchPortalView('dashboard', linkDashboard); });
  linkInventory.addEventListener('click', (e) => { e.preventDefault(); switchPortalView('inventory', linkInventory); loadInventory(); });
  linkFinances.addEventListener('click', (e) => { e.preventDefault(); switchPortalView('finances', linkFinances); loadFinances(); });

  // 1. Session Login Handler
  async function checkSession() {
    await fetchBackendData();
    const cachedSellerId = sessionStorage.getItem('velo_active_seller_id');
    if (cachedSellerId) {
      const sellers = getSellers();
      const current = sellers.find(s => s.id === cachedSellerId);
      if (current) {
        if (current.status === 'suspended') {
          sessionStorage.removeItem('velo_active_seller_id');
          showNotification('This merchant account has been suspended by the administrator.', 'error');
          return;
        }
        activeSeller = current;
        showPortal();
        return;
      }
    }
    showLogin();
  }

  function showLogin() {
    loginSection.classList.remove('hidden');
    portalSection.classList.add('hidden');
  }

  function showPortal() {
    loginSection.classList.add('hidden');
    portalSection.classList.remove('hidden');
    
    lblMerchantName.textContent = activeSeller.name;
    lblMerchantId.textContent = `Node ID: ${activeSeller.id}`;
    
    loadDashboardMetrics();
  }

  btnLogin.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showNotification('Please fill in email and password fields.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/sellers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const match = await res.json();
        activeSeller = match;
        sessionStorage.setItem('velo_active_seller_id', match.id);
        showNotification(`Welcome back, ${match.name}!`);
        showPortal();
        return;
      } else if (res.status !== 404) {
        // If it's a real server error (e.g. 400 bad request/wrong pass), notify user
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          showNotification(err.error || 'Login failed.', 'error');
          return;
        }
      }
    } catch (e) {
      console.warn("Backend offline. Trying local login.");
    }

    const sellers = getSellers();
    const match = sellers.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (!match) {
      showNotification('Merchant record not found.', 'error');
      return;
    }

    if (match.password !== password) {
      showNotification('Incorrect access password credentials.', 'error');
      return;
    }

    if (match.status === 'suspended') {
      showNotification('Your seller account has been suspended by the Admin.', 'error');
      return;
    }

    activeSeller = match;
    sessionStorage.setItem('velo_active_seller_id', match.id);
    showNotification(`Welcome back, ${match.name}!`);
    showPortal();
  });

  // Toggle Login/Register Forms
  const linkShowRegister = document.getElementById('link-show-register');
  const linkShowLogin = document.getElementById('link-show-login');
  const loginFormFields = document.getElementById('login-form-fields');
  const registerFormFields = document.getElementById('register-form-fields');

  if (linkShowRegister && linkShowLogin) {
    linkShowRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginFormFields.classList.add('hidden');
      registerFormFields.classList.remove('hidden');
    });

    linkShowLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerFormFields.classList.add('hidden');
      loginFormFields.classList.remove('hidden');
    });
  }

  // Handle Merchant Registration
  const btnRegister = document.getElementById('btn-register');
  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regPassword = document.getElementById('reg-password');
  const regConfirmPassword = document.getElementById('reg-confirm-password');

  if (btnRegister) {
    btnRegister.addEventListener('click', async () => {
      const name = regName.value.trim();
      const email = regEmail.value.trim();
      const password = regPassword.value;
      const confirmPassword = regConfirmPassword.value;
      const referral = document.getElementById('reg-referral') ? document.getElementById('reg-referral').value.trim() : '';

      if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all registration fields.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
      }

      const newSellerObj = {
        name,
        email,
        password,
        commissionRate: 5.0, // default rate
        fixedRent: 100.00,  // default rent
        referralCode: referral
      };

      try {
        const res = await fetch('/api/sellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSellerObj)
        });
        if (res.ok) {
          showNotification('Registration submitted successfully! Pending administrator approval.');
          registerFormFields.classList.add('hidden');
          loginFormFields.classList.remove('hidden');
          loginEmail.value = email;
          loginPassword.value = '';
          return;
        } else {
          const err = await res.json();
          showNotification(err.error || 'Registration failed.', 'error');
          return;
        }
      } catch (err) {
        console.warn("Backend offline. Registering locally in LocalStorage.");
      }

      // Local storage fallback registration
      const sellers = JSON.parse(localStorage.getItem('velo_sellers')) || [];
      const emailExist = sellers.some(s => s.email.toLowerCase() === email.toLowerCase());

      if (emailExist) {
        showNotification('Email address is already registered.', 'error');
        return;
      }

      const nextIdNum = sellers.length > 0 ? Math.max(...sellers.map(s => parseInt(s.id.split('-')[1]))) + 1 : 101;
      newSellerObj.id = `S-${nextIdNum}`;
      newSellerObj.status = 'pending';
      newSellerObj.sales = 0.00;

      sellers.push(newSellerObj);
      localStorage.setItem('velo_sellers', JSON.stringify(sellers));

      showNotification('Registration pending administrator approval. Please ask admin to approve S-' + newSellerObj.id);
      registerFormFields.classList.add('hidden');
      loginFormFields.classList.remove('hidden');
      loginEmail.value = email;
      loginPassword.value = '';
    });
  }

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('velo_active_seller_id');
    activeSeller = null;
    showNotification('Logged out successfully.');
    showLogin();
  });


  // 2. Overview Metrics Page Load
  async function loadDashboardMetrics() {
    if (!activeSeller) return;
    
    await fetchBackendData();
    const sellers = getSellers();
    const fresh = sellers.find(s => s.id === activeSeller.id);
    if (fresh) activeSeller = fresh;

    const sales = activeSeller.sales || 0.00;
    const rate = activeSeller.commissionRate || 0.0;
    const rent = activeSeller.fixedRent || 0.00;

    const commissionPaid = parseFloat(((sales * rate) / 100).toFixed(2));
    const netPayout = parseFloat((sales - rent - commissionPaid).toFixed(2));

    document.getElementById('stat-sales').textContent = `AED ${sales.toFixed(2)}`;
    document.getElementById('stat-rent').textContent = `AED ${rent.toFixed(2)}`;
    document.getElementById('stat-commission').textContent = `AED ${commissionPaid.toFixed(2)}`;
    document.getElementById('stat-net-payout').textContent = `AED ${netPayout.toFixed(2)}`;
  }

  async function loadFinances() {
    await loadDashboardMetrics();
    const sales = activeSeller.sales || 0.00;
    const rate = activeSeller.commissionRate || 0.0;
    const rent = activeSeller.fixedRent || 0.00;

    const commissionPaid = parseFloat(((sales * rate) / 100).toFixed(2));
    const netPayout = parseFloat((sales - rent - commissionPaid).toFixed(2));

    document.getElementById('fin-gross-sales').textContent = `AED ${sales.toFixed(2)}`;
    document.getElementById('fin-commission-rate').textContent = `${rate.toFixed(1)}%`;
    document.getElementById('fin-fixed-rent').textContent = `AED ${rent.toFixed(2)}`;
    document.getElementById('fin-net-payout').textContent = `AED ${netPayout.toFixed(2)}`;
  }


  // 3. Custom Dropdowns Handlers
  function initSleekDropdown(triggerId, optionsId, valId, callback = null) {
    const trigger = document.getElementById(triggerId);
    const options = document.getElementById(optionsId);
    const valText = document.getElementById(valId);

    if (trigger && options) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        options.classList.toggle('hidden');
      });

      const opts = options.querySelectorAll('.f-opt');
      opts.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.getAttribute('data-value');
          const label = opt.textContent;

          valText.textContent = label;
          valText.setAttribute('data-selected-val', val);

          opts.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');

          options.classList.add('hidden');
          if (callback) callback(val);
        });
      });

      document.addEventListener('click', () => {
        options.classList.add('hidden');
      });
    }
  }

  initSleekDropdown('btn-category-trigger', 'options-category', 'selected-category-val');
  initSleekDropdown('btn-weight-trigger', 'options-weight', 'selected-weight-val');
  initSleekDropdown('btn-tag-trigger', 'options-tag', 'selected-tag-val');
  
  // Custom callback for stock photos to set visual selected tag data attributes
  initSleekDropdown('btn-image-trigger', 'options-image', 'selected-image-val', (val) => {
    const trigger = document.getElementById('btn-image-trigger');
    trigger.setAttribute('data-img-url', val);
  });


  // 4. Inventory List & Add Listing Operations
  const inventoryListRows = document.getElementById('inventory-list-rows');
  const prodNameInput = document.getElementById('prod-name');
  const prodPriceInput = document.getElementById('prod-price');
  const prodOriginalPriceInput = document.getElementById('prod-original-price');
  const btnSaveProd = document.getElementById('btn-save-prod');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');

  async function loadInventory() {
    if (!activeSeller) return;
    await fetchBackendData();
    const products = getProducts();
    const sellerProducts = products.filter(p => p.sellerId === activeSeller.id);

    inventoryListRows.innerHTML = '';

    if (sellerProducts.length === 0) {
      inventoryListRows.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No products found in warehouse node. Add one on the left!</td></tr>`;
      return;
    }

    sellerProducts.forEach(prod => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${prod.image}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
            <strong>${escapeHTML(prod.name)}</strong>
          </div>
        </td>
        <td><span class="category-tag-pill">${prod.category}</span></td>
        <td>AED ${prod.price.toFixed(2)}</td>
        <td>AED ${prod.originalPrice.toFixed(2)}</td>
        <td>${prod.weight}</td>
        <td>
          <div class="row-actions">
            <button class="btn-action-edit" onclick="triggerEditProduct(${prod.id})">Edit</button>
            <button class="btn-action-delete" onclick="triggerDeleteProduct(${prod.id})">Delete</button>
          </div>
        </td>
      `;
      inventoryListRows.appendChild(tr);
    });
  }

  // HTML escape safety wrapper
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Trigger Add or Update Product
  btnSaveProd.addEventListener('click', async () => {
    const name = prodNameInput.value.trim();
    const category = document.getElementById('selected-category-val').textContent;
    const weight = document.getElementById('selected-weight-val').textContent;
    const tag = document.getElementById('selected-tag-val').textContent;
    
    const triggerImg = document.getElementById('btn-image-trigger');
    const image = triggerImg.getAttribute('data-img-url') || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

    const price = parseFloat(prodPriceInput.value);
    const originalPrice = parseFloat(prodOriginalPriceInput.value);

    if (!name || isNaN(price) || isNaN(originalPrice)) {
      showNotification('Please fill in name, price, and original price values.', 'error');
      return;
    }

    const products = getProducts();

    if (editingProductId !== null) {
      // Update via REST API
      const updatedItem = { name, category, price, originalPrice, weight, tagLabel: tag, image };
      try {
        const res = await fetch(`/api/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem)
        });
        if (res.ok) {
          showNotification('Listing updated successfully!');
          resetForm();
          await fetchBackendData();
          loadInventory();
          return;
        }
      } catch (err) {
        console.warn("Backend offline. Saving to LocalStorage fallback.");
      }

      const matchIndex = products.findIndex(p => p.id === editingProductId);
      if (matchIndex !== -1) {
        products[matchIndex] = { ...products[matchIndex], ...updatedItem };
        localStorage.setItem('velo_products', JSON.stringify(products));
        showNotification('Listing updated locally!');
        resetForm();
        loadInventory();
      }
    } else {
      // Add via REST API
      const newItem = { name, category, price, originalPrice, weight, tagLabel: tag, image, sellerId: activeSeller.id };
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (res.ok) {
          showNotification('Product published to storefront!');
          resetForm();
          await fetchBackendData();
          loadInventory();
          return;
        }
      } catch (err) {
        console.warn("Backend offline. Saving to LocalStorage fallback.");
      }

      const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      newItem.id = nextId;
      newItem.rating = 4.8;
      newItem.bestseller = false;
      products.push(newItem);
      localStorage.setItem('velo_products', JSON.stringify(products));
      showNotification('Product published locally!');
      resetForm();
      loadInventory();
    }
  });

  window.triggerEditProduct = function(productId) {
    const products = getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    editingProductId = productId;
    prodNameInput.value = prod.name;
    prodPriceInput.value = prod.price;
    prodOriginalPriceInput.value = prod.originalPrice;

    // Reset dropdown trigger display values
    document.getElementById('selected-category-val').textContent = prod.category;
    document.getElementById('selected-weight-val').textContent = prod.weight;
    document.getElementById('selected-tag-val').textContent = prod.tagLabel;
    
    const triggerImg = document.getElementById('btn-image-trigger');
    triggerImg.textContent = "Selected Product Visual";
    triggerImg.setAttribute('data-img-url', prod.image);

    document.getElementById('form-action-title').textContent = "Update Listing";
    btnSaveProd.textContent = "Save Changes";
    btnCancelEdit.classList.remove('hidden');
    window.scrollTo(0, 0);
  };

  window.triggerDeleteProduct = async function(productId) {
    if (confirm('Are you sure you want to remove this product listing?')) {
      try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        if (res.ok) {
          showNotification('Listing deleted successfully.');
          await fetchBackendData();
          loadInventory();
          return;
        }
      } catch (e) {
        console.warn("Backend offline. Deleting from LocalStorage fallback.");
      }

      let products = getProducts();
      products = products.filter(p => p.id !== productId);
      localStorage.setItem('velo_products', JSON.stringify(products));
      showNotification('Listing deleted locally.');
      loadInventory();
    }
  };

  function resetForm() {
    editingProductId = null;
    prodNameInput.value = '';
    prodPriceInput.value = '';
    prodOriginalPriceInput.value = '';

    document.getElementById('selected-category-val').textContent = 'Fresh';
    document.getElementById('selected-weight-val').textContent = '400 g';
    document.getElementById('selected-tag-val').textContent = 'Direct Sourced';

    const triggerImg = document.getElementById('btn-image-trigger');
    triggerImg.textContent = 'Select Stock Photo';
    triggerImg.removeAttribute('data-img-url');

    document.getElementById('form-action-title').textContent = "Intake New Listing";
    btnSaveProd.textContent = "Publish to Storefront";
    btnCancelEdit.classList.add('hidden');
  }

  btnCancelEdit.addEventListener('click', resetForm);

  // Run CheckSession initially
  checkSession();

});
