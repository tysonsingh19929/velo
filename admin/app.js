document.addEventListener('DOMContentLoaded', () => {

  // Global Notification System
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
      if (resProds.ok) productsCache = await resProds.json();
      
      const resSellers = await fetch('/api/sellers');
      if (resSellers.ok) sellersCache = await resSellers.json();
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
  let editingSellerId = null;
  let activeOverrideProdId = null;
  let currentFilterCat = 'All';
  let currentFilterSeller = 'All';

  // DOM Elements
  const loginSection = document.getElementById('login-section');
  const portalSection = document.getElementById('portal-section');
  const btnLogin = document.getElementById('btn-login');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const btnLogout = document.getElementById('btn-logout');

  // Navigation Links & Views
  const viewDashboard = document.getElementById('view-dashboard');
  const viewSellers = document.getElementById('view-sellers');
  const viewCatalog = document.getElementById('view-catalog');

  const linkDashboard = document.getElementById('link-dashboard');
  const linkSellers = document.getElementById('link-sellers');
  const linkCatalog = document.getElementById('link-catalog');

  function switchPortalView(viewId, activeLink) {
    [viewDashboard, viewSellers, viewCatalog].forEach(view => view.classList.add('hidden'));
    [linkDashboard, linkSellers, linkCatalog].forEach(link => link.classList.remove('active'));

    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    activeLink.classList.add('active');

    const workspaceTitle = document.getElementById('workspace-title');
    if (viewId === 'dashboard') workspaceTitle.textContent = 'Platform Overview';
    if (viewId === 'sellers') workspaceTitle.textContent = 'Sellers Management';
    if (viewId === 'catalog') workspaceTitle.textContent = 'Master Catalog';
  }

  linkDashboard.addEventListener('click', (e) => { e.preventDefault(); switchPortalView('dashboard', linkDashboard); loadDashboardStats(); });
  linkSellers.addEventListener('click', (e) => { e.preventDefault(); switchPortalView('sellers', linkSellers); loadSellersList(); });
  linkCatalog.addEventListener('click', (e) => { e.preventDefault(); switchPortalView('catalog', linkCatalog); initCatalogFilters(); loadMasterCatalog(); });

  // 1. Session Login Handler
  async function checkSession() {
    await fetchBackendData();
    const isAdminLoggedIn = sessionStorage.getItem('velo_admin_logged_in');
    if (isAdminLoggedIn === 'true') {
      showPortal();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginSection.classList.remove('hidden');
    portalSection.classList.add('hidden');
  }

  function showPortal() {
    loginSection.classList.add('hidden');
    portalSection.classList.remove('hidden');
    loadDashboardStats();
  }

  btnLogin.addEventListener('click', () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (email === 'admin@veloresell.com' && password === 'admin123') {
      sessionStorage.setItem('velo_admin_logged_in', 'true');
      showNotification('Administrator authenticated successfully.');
      showPortal();
    } else {
      showNotification('Invalid admin credential codes.', 'error');
    }
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('velo_admin_logged_in');
    showNotification('Admin session logged out.');
    showLogin();
  });


  // 2. Overview Metrics Page Load
  async function loadDashboardStats() {
    await fetchBackendData();
    const sellers = getSellers();
    const products = getProducts();

    const platformSales = sellers.reduce((sum, s) => sum + (s.sales || 0.00), 0);
    const platformCommission = sellers.reduce((sum, s) => {
      const sSales = s.sales || 0.00;
      const sRate = s.commissionRate || 0.0;
      return sum + ((sSales * sRate) / 100);
    }, 0);

    const activeSellersCount = sellers.filter(s => s.status === 'active').length;

    document.getElementById('stat-platform-sales').textContent = `AED ${platformSales.toFixed(2)}`;
    document.getElementById('stat-platform-commission').textContent = `AED ${platformCommission.toFixed(2)}`;
    document.getElementById('stat-active-sellers').textContent = activeSellersCount;
    document.getElementById('stat-platform-prods').textContent = products.length;
  }


  // 3. Custom Sleek Dropdown Helper
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


  // 4. Sellers Administration Panel
  const sellersListRows = document.getElementById('sellers-list-rows');
  const sellerNameInput = document.getElementById('seller-name');
  const sellerEmailInput = document.getElementById('seller-email');
  const sellerPasswordInput = document.getElementById('seller-password');
  const sellerCommissionInput = document.getElementById('seller-commission');
  const sellerRentInput = document.getElementById('seller-rent');
  
  const btnSaveSeller = document.getElementById('btn-save-seller');
  const btnCancelSellerEdit = document.getElementById('btn-cancel-seller-edit');

  async function loadSellersList() {
    await fetchBackendData();
    const sellers = getSellers();
    sellersListRows.innerHTML = '';

    if (sellers.length === 0) {
      sellersListRows.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No merchant sellers registered in node database.</td></tr>`;
      return;
    }

    sellers.forEach(s => {
      const tr = document.createElement('tr');
      const commissionVal = ((s.sales || 0) * (s.commissionRate || 0)) / 100;
      
      const statusLabel = s.status === 'active' 
        ? `<span class="badge-status active">Active</span>` 
        : `<span class="badge-status suspended">Suspended</span>`;

      tr.innerHTML = `
        <td>
          <strong>${escapeHTML(s.name)}</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(s.email)}</p>
        </td>
        <td><code>${s.id}</code></td>
        <td>${s.commissionRate.toFixed(1)}%</td>
        <td>AED ${s.fixedRent.toFixed(0)}</td>
        <td>${statusLabel}</td>
        <td>
          <strong>AED ${s.sales.toFixed(2)}</strong>
          <p style="font-size: 0.7rem; color: #ca8a04;">Comm: AED ${commissionVal.toFixed(2)}</p>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn-action-edit" onclick="triggerEditSeller('${s.id}')">Configure</button>
            <button class="btn-action-toggle ${s.status === 'active' ? 'suspend' : 'activate'}" onclick="toggleSellerStatus('${s.id}')">
              ${s.status === 'active' ? 'Suspend' : 'Activate'}
            </button>
            <button class="btn-action-delete" onclick="triggerDeleteSeller('${s.id}')">Delete</button>
          </div>
        </td>
      `;
      sellersListRows.appendChild(tr);
    });
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Create or Update Seller Settings
  btnSaveSeller.addEventListener('click', () => {
    const name = sellerNameInput.value.trim();
    const email = sellerEmailInput.value.trim();
    const password = sellerPasswordInput.value;
    const commission = parseFloat(sellerCommissionInput.value);
    const rent = parseFloat(sellerRentInput.value);

    if (!name || !email || !password || isNaN(commission) || isNaN(rent)) {
      showNotification('Please fill in name, email, password, commission, and rent fields.', 'error');
      return;
    }

    const sellers = getSellers();

    if (editingSellerId !== null) {
      // Update via REST API
      const updatedObj = { name, email, password, commissionRate: commission, fixedRent: rent };
      try {
        const res = await fetch(`/api/sellers/${editingSellerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedObj)
        });
        if (res.ok) {
          showNotification('Merchant configs saved successfully!');
          resetSellerForm();
          await fetchBackendData();
          loadSellersList();
          return;
        }
      } catch (err) {
        console.warn("Backend offline. Updating LocalStorage fallback.");
      }

      const matchIndex = sellers.findIndex(s => s.id === editingSellerId);
      if (matchIndex !== -1) {
        sellers[matchIndex] = { ...sellers[matchIndex], ...updatedObj };
        localStorage.setItem('velo_sellers', JSON.stringify(sellers));
        showNotification('Merchant configs saved locally!');
        resetSellerForm();
        loadSellersList();
      }
    } else {
      // Add via REST API
      const newSellerObj = { name, email, password, commissionRate: commission, fixedRent: rent };
      try {
        const res = await fetch('/api/sellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSellerObj)
        });
        if (res.ok) {
          showNotification('New merchant node created!');
          resetSellerForm();
          await fetchBackendData();
          loadSellersList();
          return;
        }
      } catch (err) {
        console.warn("Backend offline. Creating local seller fallback.");
      }

      const nextIdNum = sellers.length > 0 ? Math.max(...sellers.map(s => parseInt(s.id.split('-')[1]))) + 1 : 101;
      newSellerObj.id = `S-${nextIdNum}`;
      newSellerObj.status = 'active';
      newSellerObj.sales = 0.00;
      sellers.push(newSellerObj);
      localStorage.setItem('velo_sellers', JSON.stringify(sellers));
      showNotification('New merchant node created locally!');
      resetSellerForm();
      loadSellersList();
    }
  });

  window.triggerEditSeller = function(sellerId) {
    const sellers = getSellers();
    const s = sellers.find(seller => seller.id === sellerId);
    if (!s) return;

    editingSellerId = sellerId;
    sellerNameInput.value = s.name;
    sellerEmailInput.value = s.email;
    sellerPasswordInput.value = s.password;
    sellerCommissionInput.value = s.commissionRate;
    sellerRentInput.value = s.fixedRent;

    document.getElementById('seller-form-action-title').textContent = "Update Merchant Node";
    btnSaveSeller.textContent = "Save Changes";
    btnCancelSellerEdit.classList.remove('hidden');
    window.scrollTo(0, 0);
  };

  window.toggleSellerStatus = async function(sellerId) {
    const sellers = getSellers();
    const matchIndex = sellers.findIndex(s => s.id === sellerId);
    if (matchIndex !== -1) {
      const currentStatus = sellers[matchIndex].status;
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      try {
        const res = await fetch(`/api/sellers/${sellerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
          showNotification(`Merchant node status updated to: ${nextStatus.toUpperCase()}`);
          await fetchBackendData();
          loadSellersList();
          return;
        }
      } catch (e) {
        console.warn("Backend offline. Toggling local storage status.");
      }

      sellers[matchIndex].status = nextStatus;
      localStorage.setItem('velo_sellers', JSON.stringify(sellers));
      showNotification(`Merchant status updated locally to: ${nextStatus.toUpperCase()}`);
      loadSellersList();
    }
  };

  window.triggerDeleteSeller = async function(sellerId) {
    if (confirm('Permanently delete this merchant node? All products published by this merchant will be cleared.')) {
      try {
        const res = await fetch(`/api/sellers/${sellerId}`, { method: 'DELETE' });
        if (res.ok) {
          showNotification('Merchant node deleted from platform.');
          await fetchBackendData();
          loadSellersList();
          return;
        }
      } catch (e) {
        console.warn("Backend offline. Deleting locally.");
      }

      let sellers = getSellers();
      sellers = sellers.filter(s => s.id !== sellerId);
      localStorage.setItem('velo_sellers', JSON.stringify(sellers));

      let products = getProducts();
      products = products.filter(p => p.sellerId !== sellerId);
      localStorage.setItem('velo_products', JSON.stringify(products));

      showNotification('Merchant node deleted locally.');
      loadSellersList();
    }
  };

  function resetSellerForm() {
    editingSellerId = null;
    sellerNameInput.value = '';
    sellerEmailInput.value = '';
    sellerPasswordInput.value = '';
    sellerCommissionInput.value = '';
    sellerRentInput.value = '';

    document.getElementById('seller-form-action-title').textContent = "Configure Merchant Partner";
    btnSaveSeller.textContent = "Save Merchant Settings";
    btnCancelSellerEdit.classList.add('hidden');
  }

  btnCancelSellerEdit.addEventListener('click', resetSellerForm);


  // 5. Master Catalog Management (Edit/Override/Delete listings)
  const masterCatalogRows = document.getElementById('master-catalog-rows');
  const editProdModal = document.getElementById('edit-prod-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  
  const overrideName = document.getElementById('override-name');
  const overridePrice = document.getElementById('override-price');
  const overrideOrigPrice = document.getElementById('override-orig-price');
  const btnSubmitOverride = document.getElementById('btn-submit-override');

  function initCatalogFilters() {
    // Inject merchant options
    const sellers = getSellers();
    const filterSellerOptions = document.getElementById('options-filter-seller');
    
    filterSellerOptions.innerHTML = `<div class="f-opt active" data-value="All">All Merchants</div>`;
    sellers.forEach(s => {
      const div = document.createElement('div');
      div.className = 'f-opt';
      div.setAttribute('data-value', s.id);
      div.textContent = s.name;
      filterSellerOptions.appendChild(div);
    });

    initSleekDropdown('btn-filter-cat-trigger', 'options-filter-cat', 'selected-filter-cat-val', (val) => {
      currentFilterCat = val;
      loadMasterCatalog();
    });

    initSleekDropdown('btn-filter-seller-trigger', 'options-filter-seller', 'selected-filter-seller-val', (val) => {
      currentFilterSeller = val;
      loadMasterCatalog();
    });
  }

  async function loadMasterCatalog() {
    await fetchBackendData();
    const products = getProducts();
    const sellers = getSellers();

    let list = [...products];

    if (currentFilterCat !== 'All') {
      list = list.filter(p => p.category === currentFilterCat);
    }
    if (currentFilterSeller !== 'All') {
      list = list.filter(p => p.sellerId === currentFilterSeller);
    }

    masterCatalogRows.innerHTML = '';

    if (list.length === 0) {
      masterCatalogRows.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No products match filter settings.</td></tr>`;
      return;
    }

    list.forEach(p => {
      const matchingSeller = sellers.find(s => s.id === p.sellerId);
      const sellerLabel = matchingSeller ? `${matchingSeller.name} (${p.sellerId})` : `Unknown (${p.sellerId})`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${p.image}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
            <div>
              <strong>${escapeHTML(p.name)}</strong>
              <p style="font-size:0.75rem; color:var(--text-muted);">${p.weight}</p>
            </div>
          </div>
        </td>
        <td><span class="category-tag-pill">${p.category}</span></td>
        <td><span style="font-size:0.8rem; font-weight:600;">${escapeHTML(sellerLabel)}</span></td>
        <td>AED ${p.price.toFixed(2)}</td>
        <td>AED ${p.originalPrice.toFixed(2)}</td>
        <td>
          <div class="row-actions">
            <button class="btn-action-edit" onclick="openOverrideModal(${p.id})">Override</button>
            <button class="btn-action-delete" onclick="triggerDeleteMasterProduct(${p.id})">Remove</button>
          </div>
        </td>
      `;
      masterCatalogRows.appendChild(tr);
    });
  }

  window.openOverrideModal = function(productId) {
    const products = getProducts();
    const match = products.find(p => p.id === productId);
    if (!match) return;

    activeOverrideProdId = productId;
    overrideName.value = match.name;
    overridePrice.value = match.price;
    overrideOrigPrice.value = match.originalPrice;

    editProdModal.classList.remove('hidden');
  };

  btnCloseModal.addEventListener('click', () => {
    editProdModal.classList.add('hidden');
    activeOverrideProdId = null;
  });

  btnSubmitOverride.addEventListener('click', async () => {
    const name = overrideName.value.trim();
    const price = parseFloat(overridePrice.value);
    const origPrice = parseFloat(overrideOrigPrice.value);

    if (!name || isNaN(price) || isNaN(origPrice)) {
      showNotification('Please fill in override fields correctly.', 'error');
      return;
    }

    const products = getProducts();
    const updateObj = { name, price, originalPrice: origPrice };

    try {
      const res = await fetch(`/api/products/${activeOverrideProdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateObj)
      });
      if (res.ok) {
        showNotification('Listing overrides saved successfully.');
        editProdModal.classList.add('hidden');
        await fetchBackendData();
        loadMasterCatalog();
        return;
      }
    } catch (e) {
      console.warn("Backend offline. Overriding LocalStorage.");
    }

    const matchIndex = products.findIndex(p => p.id === activeOverrideProdId);
    if (matchIndex !== -1) {
      products[matchIndex] = { ...products[matchIndex], ...updateObj };
      localStorage.setItem('velo_products', JSON.stringify(products));
      showNotification('Listing overrides saved locally.');
      editProdModal.classList.add('hidden');
      loadMasterCatalog();
    }
  });

  window.triggerDeleteMasterProduct = async function(productId) {
    if (confirm('Are you sure you want to remove this listing from the master catalog?')) {
      try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        if (res.ok) {
          showNotification('Listing deleted successfully.');
          await fetchBackendData();
          loadMasterCatalog();
          return;
        }
      } catch (e) {
        console.warn("Backend offline. Deleting local storage entry.");
      }

      let products = getProducts();
      products = products.filter(p => p.id !== productId);
      localStorage.setItem('velo_products', JSON.stringify(products));
      showNotification('Listing deleted locally.');
      loadMasterCatalog();
    }
  };

  // Run CheckSession initially
  checkSession();

});
