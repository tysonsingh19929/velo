document.addEventListener('DOMContentLoaded', () => {

  // Global Toast System (prepares for native app packaging)
  window.showNotification = function(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto-dismiss toast
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  };

  // ==========================================
  // 1. E-Commerce Product Database (UAE mixed religion items, Zepto pricing)
  // ==========================================
  const catalogData = [
    { id: 1, name: "Fresh Organic Khalas Dates", category: "Fresh", price: 18.00, originalPrice: 28.00, weight: "400 g", rating: 4.9, bestseller: true, tagLabel: "Direct Sourced" },
    { id: 2, name: "Al Ain Fresh Whole Cow Milk", category: "Fresh", price: 7.00, originalPrice: 10.00, weight: "1 pack (1L)", rating: 4.8, bestseller: false, tagLabel: "Fresh Dairy" },
    { id: 3, name: "Premium Turkish Labneh Pouch", category: "Fresh", price: 12.00, originalPrice: 18.00, weight: "1 pack (500 g)", rating: 4.7, bestseller: true, tagLabel: "Creamy" },
    { id: 4, name: "Local Coriander Leaves Bunch", category: "Fresh", price: 2.00, originalPrice: 4.50, weight: "100 g", rating: 4.9, bestseller: false, tagLabel: "Hydroponic" },
    { id: 5, name: "Wireless Bluetooth Earbuds", category: "Electronics", price: 95.00, originalPrice: 150.00, weight: "1 unit", rating: 4.7, bestseller: true, tagLabel: "Bass Boost" },
    { id: 6, name: "Smart Fit Tracker Watch", category: "Electronics", price: 190.00, originalPrice: 275.00, weight: "1 unit", rating: 4.6, bestseller: false, tagLabel: "Active Tracker" },
    { id: 7, name: "Eco Cotton Bath Towels", category: "Essentials", price: 45.00, originalPrice: 65.00, weight: "2 pcs", rating: 4.5, bestseller: false, tagLabel: "Soft Cotton" },
    { id: 8, name: "Stainless Thermal Water Bottle", category: "Essentials", price: 28.00, originalPrice: 42.00, weight: "1 pc (750 ml)", rating: 4.7, bestseller: true, tagLabel: "Keep Cold" },
    { id: 9, name: "Hydrating Aloe Vera Serum", category: "Beauty", price: 78.00, originalPrice: 110.00, weight: "1 pack (50 ml)", rating: 4.8, bestseller: true, tagLabel: "Moisturizing" },
    { id: 10, name: "Rosewater Refreshing Face Mist", category: "Beauty", price: 42.00, originalPrice: 60.00, weight: "1 bottle (100 ml)", rating: 4.6, bestseller: false, tagLabel: "Mixed Floral" }
  ];

  // State Variables
  let cart = JSON.parse(localStorage.getItem('velo_cart')) || [];
  let walletBalance = parseFloat(localStorage.getItem('velo_wallet_balance')) || 140.00;
  let walletPoints = parseInt(localStorage.getItem('velo_wallet_points')) || 340;
  let walletReferrals = parseInt(localStorage.getItem('velo_wallet_referrals')) || 4;
  let currentCategory = 'All';
  let activeOrder = JSON.parse(localStorage.getItem('velo_active_order')) || null;

  const fulfillmentHubs = [
    {
      region: "Dubai Marina Hub #3",
      address: "Marina Promenade, Park Island Towers, Ground Floor",
      latBase: 25.0819,
      longBase: 55.1367,
      etaRange: [6, 9],
      distanceRange: [0.5, 1.2]
    },
    {
      region: "Downtown Dubai Hub #2",
      address: "Downtown Boulevard, Standpoint Residency, Plot 4",
      latBase: 25.2048,
      longBase: 55.2708,
      etaRange: [9, 12],
      distanceRange: [1.2, 2.0]
    },
    {
      region: "Jumeirah Lake Towers Hub #4",
      address: "JLT Cluster V, Lake View Commercial, Retail B3",
      latBase: 25.0744,
      longBase: 55.1438,
      etaRange: [8, 11],
      distanceRange: [0.8, 1.8]
    },
    {
      region: "Business Bay Hub #1",
      address: "Business Bay Central, Churchill Executive Tower, Bay Floor",
      latBase: 25.1852,
      longBase: 55.2744,
      etaRange: [10, 14],
      distanceRange: [1.8, 2.8]
    }
  ];

  // Professional SVG outline icons matching category selections
  function getProductSVG(category) {
    if (category === "Fresh") {
      return `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z"/></svg>`;
    } else if (category === "Electronics") {
      return `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H13.25M3 5.25V15A2.25 2.25 0 005.25 17.25h3.5M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25M16.5 7.5h.008v.008h-.008V7.5zm-9 0h.008v.008h-.008V7.5z"/></svg>`;
    } else if (category === "Essentials") {
      return `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>`;
    } else {
      return `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l4.813-2.904L18.625 21l-.813-5.096L22 12.234l-5.125-.436L15 7l-1.875 4.798-5.125.436z"/></svg>`;
    }
  }

  // ==========================================
  // 3. Navigation View Switcher (Tab routing)
  // ==========================================
  const navHome = document.getElementById('nav-home');
  const navShop = document.getElementById('nav-shop');
  const navTracker = document.getElementById('nav-tracker');
  const navWallet = document.getElementById('nav-wallet');
  const homeLogoBtn = document.getElementById('home-logo-btn');
  
  const views = document.querySelectorAll('.storefront-view');

  window.switchView = function(viewName) {
    views.forEach(view => view.classList.remove('active'));
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.m-nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    const activeNav = document.getElementById(`nav-${viewName === 'homepage' ? 'home' : viewName}`);
    if (activeNav) activeNav.classList.add('active');

    const activeMNav = document.getElementById(`m-nav-${viewName === 'homepage' ? 'home' : viewName}`);
    if (activeMNav) activeMNav.classList.add('active');

    window.scrollTo(0, 0);

    if (viewName === 'tracker') {
      initializeLiveTracker();
    }
  };

  if (navHome) navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('homepage'); });
  if (navShop) navShop.addEventListener('click', (e) => { e.preventDefault(); switchView('shop'); });
  if (navTracker) navTracker.addEventListener('click', (e) => { e.preventDefault(); switchView('tracker'); });
  if (navWallet) navWallet.addEventListener('click', (e) => { e.preventDefault(); switchView('wallet'); });
  if (homeLogoBtn) homeLogoBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('homepage'); });

  // ==========================================
  // 4. Catalog & Shelf Rendering (Zepto Card Style)
  // ==========================================
  const catalogGrid = document.getElementById('catalog-grid');
  const activeCategoryBadge = document.getElementById('active-category-badge');
  const resultsCountLabel = document.getElementById('results-count-label');
  const sortSelect = document.getElementById('sort-select');

  // Shelves grids
  const shelfFreshGrid = document.getElementById('shelf-fresh-grid');
  const shelfTechGrid = document.getElementById('shelf-tech-grid');
  const shelfEssentialsGrid = document.getElementById('shelf-essentials-grid');

  function renderCatalog() {
    if (!catalogGrid) return;
    
    let items = [...catalogData];
    
    if (currentCategory !== 'All') {
      items = items.filter(item => item.category === currentCategory);
    }
    
    const sortVal = sortSelect.value;
    if (sortVal === 'price-low') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
      items.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    }

    resultsCountLabel.textContent = `Showing ${items.length} products`;
    activeCategoryBadge.textContent = currentCategory === 'All' ? 'All Categories' : `${currentCategory} Category`;

    catalogGrid.innerHTML = '';
    items.forEach(item => {
      catalogGrid.appendChild(createProductCard(item));
    });
  }

  function appendSeeAllCard(container, category) {
    const card = document.createElement('div');
    card.className = 'product-card see-all-card';
    card.onclick = () => filterByCategory(category);
    card.innerHTML = `
      <div class="see-all-card-content">
        <span>See All</span>
        <div class="see-all-circle-arrow">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    `;
    container.appendChild(card);
  }

  function renderHomepageShelves() {
    if (shelfFreshGrid) {
      shelfFreshGrid.innerHTML = '';
      const items = catalogData.filter(item => item.category === 'Fresh').slice(0, 4);
      items.forEach(item => shelfFreshGrid.appendChild(createProductCard(item)));
      appendSeeAllCard(shelfFreshGrid, 'Fresh');
    }
    if (shelfTechGrid) {
      shelfTechGrid.innerHTML = '';
      const items = catalogData.filter(item => item.category === 'Electronics').slice(0, 4);
      items.forEach(item => shelfTechGrid.appendChild(createProductCard(item)));
      appendSeeAllCard(shelfTechGrid, 'Electronics');
    }
    if (shelfEssentialsGrid) {
      shelfEssentialsGrid.innerHTML = '';
      const items = catalogData.filter(item => item.category === 'Essentials').slice(0, 4);
      items.forEach(item => shelfEssentialsGrid.appendChild(createProductCard(item)));
      appendSeeAllCard(shelfEssentialsGrid, 'Essentials');
    }
  }

  function createProductCard(item) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const svgIcon = getProductSVG(item.category);
    const savings = Math.round(item.originalPrice - item.price);
    
    // Star rating
    let starsStr = '★ ' + item.rating;

    // Bestseller tag
    const bestsellerTag = item.bestseller ? `<div class="prod-bestseller-badge">Bestseller</div>` : '';

    // Zepto layout card structure:
    // Solid green price tag (badge), strike-through, green off label, bottom outline pill.
    card.innerHTML = `
      ${bestsellerTag}
      <div class="prod-img-box">
        ${svgIcon}
        <button class="btn-add-floating" onclick="triggerAddToCart(${item.id}); event.stopPropagation();">ADD</button>
      </div>
      <div class="prod-info">
        <span class="prod-rating-badge">${starsStr}</span>
        <h4 class="prod-title">${escapeHTML(item.name)}</h4>
        <div class="prod-weight-lbl">${item.weight}</div>
        
        <div class="prod-price-row">
          <div class="price-figures">
            <div class="price-badge-row">
              <span class="price-badge-green">AED ${item.price.toFixed(0)}</span>
              <span class="prod-original-price">AED ${item.originalPrice.toFixed(0)}</span>
            </div>
            <span class="discount-badge-text">AED ${savings} OFF</span>
          </div>
        </div>

        <div class="prod-tag-pill">${item.tagLabel}</div>
      </div>
    `;
    return card;
  }

  window.filterByCategory = function(category) {
    currentCategory = category;
    
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.classList.remove('active');
    });
    
    const activePill = document.getElementById(`pill-${category}`);
    if (activePill) activePill.classList.add('active');

    switchView('shop');
    renderCatalog();
  };

  if (sortSelect) {
    sortSelect.addEventListener('change', renderCatalog);
  }

  // Search input triggers
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  function triggerSearch() {
    const val = searchInput.value.trim().toLowerCase();
    if (!val) return;
    
    switchView('shop');
    currentCategory = 'All';
    activeCategoryBadge.textContent = `Search: "${val}"`;

    let itemsFiltered = catalogData.filter(item => item.name.toLowerCase().includes(val));
    resultsCountLabel.textContent = `Showing ${itemsFiltered.length} products`;

    catalogGrid.innerHTML = '';
    itemsFiltered.forEach(item => {
      catalogGrid.appendChild(createProductCard(item));
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', triggerSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });
  }

  // ==========================================
  // 5. Shopping Cart Drawer System
  // ==========================================
  const btnOpenCart = document.getElementById('btn-open-cart');
  const btnCloseCart = document.getElementById('btn-close-cart');
  const cartDrawerBg = document.getElementById('cart-drawer-bg');
  const cartDrawerContainer = document.getElementById('cart-drawer-container');
  const cartBadgeCount = document.getElementById('cart-badge-count');
  
  const drawerCartList = document.getElementById('drawer-cart-list');
  const drawerNet = document.getElementById('drawer-net');
  const drawerVat = document.getElementById('drawer-vat');
  const drawerTotal = document.getElementById('drawer-total');
  const btnCheckoutDrawer = document.getElementById('btn-checkout-drawer');

  function toggleCartDrawer(open) {
    if (open) {
      cartDrawerBg.classList.add('active');
      cartDrawerContainer.classList.add('active');
      renderCartDrawer();
    } else {
      cartDrawerBg.classList.remove('active');
      cartDrawerContainer.classList.remove('active');
    }
  }

  if (btnOpenCart) btnOpenCart.addEventListener('click', () => toggleCartDrawer(true));
  if (btnCloseCart) btnCloseCart.addEventListener('click', () => toggleCartDrawer(false));
  if (cartDrawerBg) cartDrawerBg.addEventListener('click', () => toggleCartDrawer(false));

  window.triggerAddToCart = function(productId) {
    const product = catalogData.find(item => item.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('velo_cart', JSON.stringify(cart));
    updateCartBadge();
    
    btnOpenCart.style.transform = 'scale(1.2)';
    setTimeout(() => {
      btnOpenCart.style.transform = 'none';
    }, 200);

    showNotification(`${product.name} added to cart.`);
    renderCartDrawer();
  };

  window.updateCartQuantity = function(id, delta) {
    const item = cart.find(item => item.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(c => c.id !== id);
    }

    localStorage.setItem('velo_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartDrawer();
  };

  function updateCartBadge() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadgeCount.textContent = totalCount;
  }

  function renderCartDrawer() {
    if (cart.length === 0) {
      drawerCartList.innerHTML = `<p class="text-muted text-center" style="font-size: 0.85rem; padding: 40px 0;">Cart is empty. Browse catalog to add essentials.</p>`;
      drawerNet.textContent = 'AED 0.00';
      drawerVat.textContent = 'AED 0.00';
      drawerTotal.textContent = 'AED 0.00';
      btnCheckoutDrawer.disabled = true;
      return;
    }

    drawerCartList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
      const lineCost = item.price * item.quantity;
      total += lineCost;
      
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div style="text-align: left;">
          <strong>${escapeHTML(item.name)}</strong>
          <p style="font-size: 0.75rem;">AED ${item.price.toFixed(2)} each</p>
        </div>
        <div class="flex-align-center" style="gap: 8px;">
          <button class="btn btn-secondary btn-icon" style="width: 24px; height: 24px; padding: 0;" onclick="updateCartQuantity(${item.id}, -1)">-</button>
          <span style="font-size: 0.85rem; font-weight:600;">${item.quantity}</span>
          <button class="btn btn-secondary btn-icon" style="width: 24px; height: 24px; padding: 0;" onclick="updateCartQuantity(${item.id}, 1)">+</button>
          <span style="font-size: 0.85rem; font-weight:700; margin-left: 12px; min-width: 60px; text-align: right;">AED ${lineCost.toFixed(2)}</span>
        </div>
      `;
      drawerCartList.appendChild(row);
    });

    const netVal = total / 1.05;
    const vatVal = total - netVal;

    drawerNet.textContent = `AED ${netVal.toFixed(2)}`;
    drawerVat.textContent = `AED ${vatVal.toFixed(2)}`;
    drawerTotal.textContent = `AED ${total.toFixed(2)}`;
    btnCheckoutDrawer.disabled = false;
  }

  if (btnCheckoutDrawer) {
    btnCheckoutDrawer.addEventListener('click', () => {
      toggleCartDrawer(false);
      switchView('checkout');
      renderCheckoutInvoice();
    });
  }

  // ==========================================
  // 6. E-Commerce Checkout Form & Address Pin Map
  // ==========================================
  const chkMapContainer = document.getElementById('checkout-map-container');
  const chkMapPin = document.getElementById('checkout-map-pin');
  
  const chkDestNode = document.getElementById('chk-dest-node');
  const chkDestEta = document.getElementById('chk-dest-eta');
  const chkAddress = document.getElementById('chk-address');
  
  const payOptCard = document.getElementById('pay-opt-card');
  const payOptCod = document.getElementById('pay-opt-cod');
  const cardDetailsInputs = document.getElementById('card-details-inputs');
  
  const invoiceItemsList = document.getElementById('invoice-items-list');
  const invoiceNet = document.getElementById('invoice-net');
  const invoiceVat = document.getElementById('invoice-vat');
  const invoiceSurchargeRow = document.getElementById('invoice-surcharge-row');
  const invoiceTotal = document.getElementById('invoice-total');
  
  const btnSubmitOrder = document.getElementById('btn-submit-order');

  let selectedPaymentMethod = 'card';
  let activeHubNode = fulfillmentHubs[1]; // Default: Downtown Dubai Hub #2
  let currentEstimatedEta = 11;
  let currentDistance = 1.8;

  function updateAddressState(hub, distance, eta, addressStr) {
    activeHubNode = hub;
    currentDistance = distance;
    currentEstimatedEta = eta;

    // Update checkout fields
    if (chkDestNode) chkDestNode.value = hub.region;
    if (chkDestEta) chkDestEta.value = `${eta} mins (Micro-Fulfillment)`;
    if (chkAddress) chkAddress.value = addressStr;

    // Update header display text
    const headerDisplay = document.getElementById('header-location-display');
    if (headerDisplay) {
      headerDisplay.textContent = hub.region;
      headerDisplay.style.fontWeight = '700';
    }
  }

  function handleMapClick(mapContainer, mapPin, destNodeInput, destEtaInput, addressInput, callback) {
    mapContainer.addEventListener('click', (e) => {
      const rect = mapContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const percentX = (clickX / rect.width) * 100;
      const percentY = (clickY / rect.height) * 100;
      
      mapPin.style.left = `${percentX}%`;
      mapPin.style.top = `${percentY}%`;
      
      let selectedHub;
      if (percentX < 50 && percentY < 50) {
        selectedHub = fulfillmentHubs[0];
      } else if (percentX >= 50 && percentY < 50) {
        selectedHub = fulfillmentHubs[1];
      } else if (percentX < 50 && percentY >= 50) {
        selectedHub = fulfillmentHubs[2];
      } else {
        selectedHub = fulfillmentHubs[3];
      }
      
      const dist = parseFloat((Math.random() * (selectedHub.distanceRange[1] - selectedHub.distanceRange[0]) + selectedHub.distanceRange[0]).toFixed(1));
      const eta = Math.floor(Math.random() * (selectedHub.etaRange[1] - selectedHub.etaRange[0] + 1)) + selectedHub.etaRange[0];
      
      destNodeInput.value = selectedHub.region;
      destEtaInput.value = `${eta} mins (Micro-Fulfillment)`;
      addressInput.value = selectedHub.address;

      if (callback) callback(selectedHub, dist, eta, selectedHub.address);
    });
  }

  // Register checkout map click
  if (chkMapContainer) {
    handleMapClick(chkMapContainer, chkMapPin, chkDestNode, chkDestEta, chkAddress, (hub, dist, eta, addr) => {
      updateAddressState(hub, dist, eta, addr);
      const hdrMapPin = document.getElementById('header-map-pin');
      if (hdrMapPin) {
        hdrMapPin.style.left = chkMapPin.style.left;
        hdrMapPin.style.top = chkMapPin.style.top;
      }
    });
  }

  // Payment Options clicks
  if (payOptCard && payOptCod) {
    payOptCard.addEventListener('click', () => {
      payOptCard.classList.add('active');
      payOptCod.classList.remove('active');
      cardDetailsInputs.classList.remove('hidden');
      selectedPaymentMethod = 'card';
      invoiceSurchargeRow.style.display = 'none';
      recalculateCheckoutInvoiceTotals();
    });

    payOptCod.addEventListener('click', () => {
      payOptCod.classList.add('active');
      payOptCard.classList.remove('active');
      cardDetailsInputs.classList.add('hidden');
      selectedPaymentMethod = 'cod';
      invoiceSurchargeRow.style.display = 'flex';
      recalculateCheckoutInvoiceTotals();
    });
  }

  function renderCheckoutInvoice() {
    if (!invoiceItemsList) return;
    invoiceItemsList.innerHTML = '';
    
    if (cart.length === 0) {
      invoiceItemsList.innerHTML = `<p class="text-muted" style="font-size: 0.85rem;">No items in cart.</p>`;
      return;
    }

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'invoice-row';
      row.innerHTML = `
        <span>${escapeHTML(item.name)} (x${item.quantity})</span>
        <span>AED ${(item.price * item.quantity).toFixed(2)}</span>
      `;
      invoiceItemsList.appendChild(row);
    });

    recalculateCheckoutInvoiceTotals();
  }

  function recalculateCheckoutInvoiceTotals() {
    let itemsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let surcharge = selectedPaymentMethod === 'cod' ? 10.00 : 0.00;
    
    let total = itemsTotal + surcharge;
    let netVal = itemsTotal / 1.05;
    let vatVal = itemsTotal - netVal;

    invoiceNet.textContent = `AED ${netVal.toFixed(2)}`;
    invoiceVat.textContent = `AED ${vatVal.toFixed(2)}`;
    invoiceTotal.textContent = `AED ${total.toFixed(2)}`;
  }

  if (btnSubmitOrder) {
    btnSubmitOrder.addEventListener('click', () => {
      if (cart.length === 0) {
        showNotification('Your cart is empty.');
        return;
      }

      if (selectedPaymentMethod === 'card') {
        const cardNum = document.getElementById('chk-card-num').value.trim();
        const expiry = document.getElementById('chk-card-expiry').value.trim();
        const cvv = document.getElementById('chk-card-cvv').value.trim();

        if (!cardNum || !expiry || !cvv) {
          showNotification('Please enter your card payment details.');
          return;
        }
      }

      let grossTotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (selectedPaymentMethod === 'cod') grossTotalAmount += 10.00;

      activeOrder = {
        id: 'VR-' + Math.floor(100000 + Math.random() * 900000),
        items: [...cart],
        payoutAmount: grossTotalAmount,
        hubNode: activeHubNode.region,
        address: chkAddress.value,
        eta: currentEstimatedEta,
        distance: currentDistance,
        status: 'Dispatched',
        date: new Date().toLocaleDateString()
      };

      localStorage.setItem('velo_active_order', JSON.stringify(activeOrder));
      
      walletPoints += 15;
      localStorage.setItem('velo_wallet_points', walletPoints.toString());
      logWalletLedgerEvent('Catalog checkout order: +15 pts earned.');

      cart = [];
      localStorage.setItem('velo_cart', JSON.stringify(cart));
      updateCartBadge();

      showNotification(`Order placed! Order ID: ${activeOrder.id}. Transmitting delivery routing...`);
      switchView('tracker');
    });
  }

  // ==========================================
  // 6b. Header "Select Location" Modal Map Handler
  // ==========================================
  const btnSelectLocationHeader = document.getElementById('btn-select-location-header');
  const btnCloseLocationModal = document.getElementById('btn-close-location-modal');
  const locationMapModalContainer = document.getElementById('location-map-modal-container');
  const btnConfirmLocation = document.getElementById('btn-confirm-location');
  
  const headerMapContainer = document.getElementById('header-map-container');
  const headerMapPin = document.getElementById('header-map-pin');
  const hdrDestNode = document.getElementById('hdr-dest-node');
  const hdrDestEta = document.getElementById('hdr-dest-eta');
  const hdrAddressInput = document.getElementById('hdr-address-input');

  let tempSelectedHub = fulfillmentHubs[1];
  let tempDistance = 1.8;
  let tempEta = 11;

  if (btnSelectLocationHeader) {
    btnSelectLocationHeader.addEventListener('click', () => {
      locationMapModalContainer.classList.remove('hidden');
    });
  }

  if (btnCloseLocationModal) {
    btnCloseLocationModal.addEventListener('click', () => {
      locationMapModalContainer.classList.add('hidden');
    });
  }

  if (headerMapContainer) {
    handleMapClick(headerMapContainer, headerMapPin, hdrDestNode, hdrDestEta, hdrAddressInput, (hub, dist, eta, addr) => {
      tempSelectedHub = hub;
      tempDistance = dist;
      tempEta = eta;

      const chkMapPin = document.getElementById('checkout-map-pin');
      if (chkMapPin) {
        chkMapPin.style.left = headerMapPin.style.left;
        chkMapPin.style.top = headerMapPin.style.top;
      }
    });
  }

  if (btnConfirmLocation) {
    btnConfirmLocation.addEventListener('click', () => {
      updateAddressState(tempSelectedHub, tempDistance, tempEta, hdrAddressInput.value);
      locationMapModalContainer.classList.add('hidden');
      showNotification(`Location set to ${tempSelectedHub.region}.`);
    });
  }

  // ==========================================
  // 7. Live Transit Delivery Tracker
  // ==========================================
  const courierPin = document.getElementById('tracker-courier-pin');
  const timerLbl = document.getElementById('tracker-countdown-timer');
  const nodeLbl = document.getElementById('tracker-dispatch-node-lbl');
  const distanceLbl = document.getElementById('tracker-dist-val');
  
  const mapHubNode = document.getElementById('tracker-map-hub-node');
  const mapCustNode = document.getElementById('tracker-map-cust-node');
  
  const stepLine = document.getElementById('step-line-indicator');
  const stageSteps = document.querySelectorAll('.stage-step');

  let trackingInterval;

  function initializeLiveTracker() {
    clearInterval(trackingInterval);
    
    if (!activeOrder) {
      timerLbl.textContent = "00:00";
      nodeLbl.textContent = "No active order";
      distanceLbl.textContent = "0.0 km";
      stepLine.style.height = '0%';
      stageSteps.forEach(s => s.classList.remove('done', 'active'));
      return;
    }

    nodeLbl.textContent = activeOrder.hubNode;
    distanceLbl.textContent = `${activeOrder.distance} km`;

    let hubTop = 35;
    let hubLeft = 35;
    let custTop = 65;
    let custLeft = 70;

    mapHubNode.style.top = `${hubTop}%`;
    mapHubNode.style.left = `${hubLeft}%`;
    
    mapCustNode.style.top = `${custTop}%`;
    mapCustNode.style.left = `${custLeft}%`;

    courierPin.style.top = `${hubTop}%`;
    courierPin.style.left = `${hubLeft}%`;

    let secondsRemaining = activeOrder.eta * 60;
    
    stepLine.style.height = '33%';
    stageSteps[0].className = 'stage-step done';
    stageSteps[1].className = 'stage-step active';
    stageSteps[2].className = 'stage-step';

    trackingInterval = setInterval(() => {
      secondsRemaining -= 15; 
      if (secondsRemaining <= 0) {
        clearInterval(trackingInterval);
        timerLbl.textContent = "Arrived!";
        distanceLbl.textContent = "0.0 km";
        courierPin.style.top = `${custTop}%`;
        courierPin.style.left = `${custLeft}%`;
        
        stepLine.style.height = '100%';
        stageSteps[1].className = 'stage-step done';
        stageSteps[2].className = 'stage-step done';
        
        activeOrder.status = 'Delivered';
        localStorage.setItem('velo_active_order', JSON.stringify(activeOrder));
        return;
      }

      let min = Math.floor(secondsRemaining / 60);
      let sec = Math.floor(secondsRemaining % 60);
      timerLbl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

      const totalSeconds = activeOrder.eta * 60;
      const ratio = 1 - (secondsRemaining / totalSeconds);
      
      const currentTop = hubTop + (custTop - hubTop) * ratio;
      const currentLeft = hubLeft + (custLeft - hubLeft) * ratio;
      
      courierPin.style.top = `${currentTop}%`;
      courierPin.style.left = `${currentLeft}%`;
      
      const remainingDist = (activeOrder.distance * (1 - ratio)).toFixed(1);
      distanceLbl.textContent = `${remainingDist} km`;

      if (ratio > 0.5 && ratio < 0.9) {
        stepLine.style.height = '66%';
      }
    }, 1000);
  }

  // ==========================================
  // 8. User Rewards Wallet Ledger
  // ==========================================
  const walletRewardsBal = document.getElementById('wallet-rewards-bal');
  const walletShoppingPts = document.getElementById('wallet-shopping-pts');
  const walletReferralsCount = document.getElementById('wallet-referrals-count');
  
  const btnCopyRef = document.getElementById('btn-copy-ref-link');
  const walletHistoryLogs = document.getElementById('wallet-history-logs');

  function renderWalletData() {
    if (!walletRewardsBal) return;

    walletRewardsBal.textContent = `AED ${walletBalance.toFixed(2)}`;
    walletShoppingPts.textContent = walletPoints;
    walletReferralsCount.textContent = walletReferrals;
  }

  function logWalletLedgerEvent(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let logs = JSON.parse(localStorage.getItem('velo_wallet_logs')) || [];
    logs.unshift({ time, msg });
    
    while (logs.length > 5) logs.pop();
    
    localStorage.setItem('velo_wallet_logs', JSON.stringify(logs));
    renderWalletLedgerLogs();
  }

  function renderWalletLedgerLogs() {
    if (!walletHistoryLogs) return;
    
    let logs = JSON.parse(localStorage.getItem('velo_wallet_logs')) || [];
    
    if (logs.length === 0) {
      walletHistoryLogs.innerHTML = `<p class="text-muted" style="font-size: 0.8rem; padding: 12px 0;">No reward events logged.</p>`;
      return;
    }

    walletHistoryLogs.innerHTML = '';
    logs.forEach(log => {
      const row = document.createElement('div');
      row.className = 'log-entry';
      row.innerHTML = `
        <span class="log-time">${log.time}</span>
        <span class="log-msg">${escapeHTML(log.msg)}</span>
      `;
      walletHistoryLogs.appendChild(row);
    });
  }

  if (btnCopyRef) {
    btnCopyRef.addEventListener('click', () => {
      const refLink = document.getElementById('chk-referral-link');
      refLink.select();
      document.execCommand('copy');
      
      btnCopyRef.textContent = 'Copied!';
      setTimeout(() => {
        btnCopyRef.textContent = 'Copy Link';
      }, 2000);
      
      walletBalance += 25.00;
      walletPoints += 50;
      walletReferrals += 1;
      
      localStorage.setItem('velo_wallet_balance', walletBalance.toString());
      localStorage.setItem('velo_wallet_points', walletPoints.toString());
      localStorage.setItem('velo_wallet_referrals', walletReferrals.toString());
      
      renderWalletData();
      logWalletLedgerEvent('Referral confirmed. Account credited: +AED 25.00 / +50 pts.');
    });
  }

  // ==========================================
  // 9. Profile Verification Modal (MFA Access)
  // ==========================================
  const btnOpenProfile = document.getElementById('btn-open-profile');
  const btnCloseProfile = document.getElementById('btn-close-profile');
  const profileModalContainer = document.getElementById('profile-modal-container');
  
  const btnModalSendOtp = document.getElementById('btn-modal-send-otp');
  const btnModalVerifyOtp = document.getElementById('btn-modal-verify-otp');
  const btnModalReset = document.getElementById('btn-modal-reset');
  
  const modalStep1 = document.getElementById('modal-step-1');
  const modalStep2 = document.getElementById('modal-step-2');
  const modalStepSuccess = document.getElementById('modal-step-success');
  
  const modalPhone = document.getElementById('modal-phone');
  const modalEmail = document.getElementById('modal-email');
  const modalOtpTarget = document.getElementById('modal-otp-target-phone');
  const modalOtpBoxes = document.querySelectorAll('#profile-modal-container .otp-box-input');

  function toggleProfileModal(open) {
    if (open) {
      profileModalContainer.classList.remove('hidden');
    } else {
      profileModalContainer.classList.add('hidden');
    }
  }

  if (btnOpenProfile) btnOpenProfile.addEventListener('click', () => toggleProfileModal(true));
  if (btnCloseProfile) btnCloseProfile.addEventListener('click', () => toggleProfileModal(false));

  if (btnModalSendOtp) {
    btnModalSendOtp.addEventListener('click', () => {
      const phone = modalPhone.value.trim();
      const email = modalEmail.value.trim();
      
      if (!phone || !email) {
        showNotification('Please fill in both fields.');
        return;
      }

      modalOtpTarget.textContent = `+971 ${phone}`;
      modalStep1.classList.add('hidden');
      modalStep2.classList.remove('hidden');
      
      setTimeout(() => {
        modalOtpBoxes[0].focus();
      }, 50);
    });
  }

  modalOtpBoxes.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length === 1 && index < modalOtpBoxes.length - 1) {
        modalOtpBoxes[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
        modalOtpBoxes[index - 1].focus();
      }
    });
  });

  if (btnModalVerifyOtp) {
    btnModalVerifyOtp.addEventListener('click', () => {
      let code = '';
      modalOtpBoxes.forEach(input => code += input.value);
      
      if (code.length < 6) {
        showNotification('Please enter a valid 6-digit verification code.');
        return;
      }

      modalStep2.classList.add('hidden');
      modalStepSuccess.classList.remove('hidden');
      
      logWalletLedgerEvent('MFA Security token verification successful.');
    });
  }

  if (btnModalReset) {
    btnModalReset.addEventListener('click', () => {
      modalPhone.value = '';
      modalEmail.value = '';
      modalOtpBoxes.forEach(input => input.value = '');
      
      modalStepSuccess.classList.add('hidden');
      modalStep1.classList.remove('hidden');
    });
  }

  // ==========================================
  // Helper Utilities
  // ==========================================
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Initialize
  renderCatalog();
  renderHomepageShelves();
  updateCartBadge();
  renderWalletData();
  renderWalletLedgerLogs();

});
