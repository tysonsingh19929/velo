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

  // Database Load Helpers
  function getSellers() {
    return JSON.parse(localStorage.getItem('velo_sellers')) || [];
  }
  function getProducts() {
    return JSON.parse(localStorage.getItem('velo_products')) || [];
  }
  function saveSellers(sellers) {
    localStorage.setItem('velo_sellers', JSON.stringify(sellers));
  }
  function saveProducts(products) {
    localStorage.setItem('velo_products', JSON.stringify(products));
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
  function checkSession() {
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

  btnLogin.addEventListener('click', () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showNotification('Please fill in email and password fields.', 'error');
      return;
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

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('velo_active_seller_id');
    activeSeller = null;
    showNotification('Logged out successfully.');
    showLogin();
  });


  // 2. Overview Metrics Page Load
  function loadDashboardMetrics() {
    if (!activeSeller) return;
    
    // Fetch fresh seller records from db
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

  function loadFinances() {
    loadDashboardMetrics();
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

  function loadInventory() {
    if (!activeSeller) return;
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
  btnSaveProd.addEventListener('click', () => {
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
      // Update
      const matchIndex = products.findIndex(p => p.id === editingProductId);
      if (matchIndex !== -1) {
        products[matchIndex].name = name;
        products[matchIndex].category = category;
        products[matchIndex].price = price;
        products[matchIndex].originalPrice = originalPrice;
        products[matchIndex].weight = weight;
        products[matchIndex].tagLabel = tag;
        products[matchIndex].image = image;

        saveProducts(products);
        showNotification('Listing updated successfully!');
        resetForm();
        loadInventory();
      }
    } else {
      // Add
      const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const newProd = {
        id: nextId,
        name: name,
        category: category,
        price: price,
        originalPrice: originalPrice,
        weight: weight,
        rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
        bestseller: false,
        tagLabel: tag,
        image: image,
        sellerId: activeSeller.id
      };

      products.push(newProd);
      saveProducts(products);
      showNotification('Product published to customer storefront!');
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

  window.triggerDeleteProduct = function(productId) {
    if (confirm('Are you sure you want to remove this product listing?')) {
      let products = getProducts();
      products = products.filter(p => p.id !== productId);
      saveProducts(products);
      showNotification('Listing deleted successfully.');
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
