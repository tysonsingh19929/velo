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
  // 1. E-Commerce Product Database
  // ==========================================
  const catalogData = [
    { id: 1, name: "Fresh Organic Avocados (4-Pack)", category: "Fresh", price: 28.00, rating: 4.8, featured: true },
    { id: 2, name: "Organic Whole Milk 1L", category: "Fresh", price: 8.50, rating: 4.9, featured: true },
    { id: 3, name: "Wireless Bluetooth Earbuds", category: "Electronics", price: 105.00, rating: 4.7, featured: true },
    { id: 4, name: "Smart Fit Tracker Watch", category: "Electronics", price: 195.00, rating: 4.6, featured: false },
    { id: 5, name: "Eco Cotton Bath Towels", category: "Essentials", price: 48.00, rating: 4.5, featured: false },
    { id: 6, name: "Stainless Thermal Water Bottle", category: "Essentials", price: 32.00, rating: 4.7, featured: true },
    { id: 7, name: "Matte Liquid Lipstick", category: "Beauty", price: 62.00, rating: 4.4, featured: false },
    { id: 8, name: "Hydrating Aloe Face Serum", category: "Beauty", price: 88.00, rating: 4.8, featured: true }
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

  // Professional SVG outline icons matching category selections (emoji replacements)
  function getProductSVG(category) {
    if (category === "Fresh") {
      // Shopping Cart/Basket outline
      return `<svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>`;
    } else if (category === "Electronics") {
      // Tech/Headphone outline
      return `<svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H13.25M3 5.25V15A2.25 2.25 0 005.25 17.25h3.5M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25M16.5 7.5h.008v.008h-.008V7.5zm-9 0h.008v.008h-.008V7.5z"/></svg>`;
    } else if (category === "Essentials") {
      // Home outline
      return `<svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>`;
    } else {
      // Beauty/Cosmetic Sparkle or Star outline
      return `<svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l4.813-2.904L18.625 21l-.813-5.096L22 12.234l-5.125-.436L15 7l-1.875 4.798-5.125.436z"/></svg>`;
    }
  }

  // ==========================================
  // 2. Carousel Banner Slider Logic
  // ==========================================
  const carouselSlides = document.querySelectorAll('.carousel-slide');
  const carouselPrev = document.getElementById('carousel-prev-btn');
  const carouselNext = document.getElementById('carousel-next-btn');
  let currentSlideIndex = 0;
  let carouselInterval;

  function showSlide(index) {
    if (carouselSlides.length === 0) return;
    carouselSlides.forEach(slide => slide.classList.remove('active'));
    currentSlideIndex = (index + carouselSlides.length) % carouselSlides.length;
    carouselSlides[currentSlideIndex].classList.add('active');
  }

  function startCarouselTimer() {
    if (carouselSlides.length === 0) return;
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
      showSlide(currentSlideIndex + 1);
    }, 5000);
  }

  if (carouselPrev && carouselNext) {
    carouselPrev.addEventListener('click', () => {
      showSlide(currentSlideIndex - 1);
      startCarouselTimer();
    });
    carouselNext.addEventListener('click', () => {
      showSlide(currentSlideIndex + 1);
      startCarouselTimer();
    });
    startCarouselTimer();
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
    
    // Clear active classes from desktop and mobile menus
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.m-nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    // Desktop Nav Sync
    const activeNav = document.getElementById(`nav-${viewName === 'homepage' ? 'home' : viewName}`);
    if (activeNav) activeNav.classList.add('active');

    // Mobile Nav Sync
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
  // 4. Catalog Rendering, Category Filtering & Sort
  // ==========================================
  const catalogGrid = document.getElementById('catalog-grid');
  const homepageFeaturedGrid = document.getElementById('homepage-featured-grid');
  const activeCategoryBadge = document.getElementById('active-category-badge');
  const resultsCountLabel = document.getElementById('results-count-label');
  const sortSelect = document.getElementById('sort-select');

  function renderCatalog() {
    if (!catalogGrid) return;
    
    let items = [...catalogData];
    
    // Category filter
    if (currentCategory !== 'All') {
      items = items.filter(item => item.category === currentCategory);
    }
    
    // Sort
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

  function renderHomepageFeatured() {
    if (!homepageFeaturedGrid) return;
    homepageFeaturedGrid.innerHTML = '';
    const featuredItems = catalogData.filter(item => item.featured);
    featuredItems.forEach(item => {
      homepageFeaturedGrid.appendChild(createProductCard(item));
    });
  }

  function createProductCard(item) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    let stars = '★'.repeat(Math.round(item.rating)) + '☆'.repeat(5 - Math.round(item.rating));
    const svgIcon = getProductSVG(item.category);
    
    card.innerHTML = `
      <span class="prod-badge">⚡ 10-Min Delivery</span>
      <div class="prod-img-box">${svgIcon}</div>
      <div class="prod-info">
        <div class="prod-rating">${stars} (${item.rating})</div>
        <h4 class="prod-title">${item.name}</h4>
        <div class="prod-price-block">
          <span class="prod-retail-price">AED ${item.price.toFixed(2)}</span>
          <span class="prod-vat-tag">VAT 5% inclusive (AED ${(item.price - (item.price/1.05)).toFixed(2)} tax)</span>
        </div>
      </div>
      <button class="btn btn-add-cart" onclick="triggerAddToCart(${item.id})">Add to Cart</button>
    `;
    return card;
  }

  window.filterByCategory = function(category) {
    currentCategory = category;
    
    const filterLinks = document.querySelectorAll('.filter-link');
    filterLinks.forEach(link => {
      if (link.textContent.includes(category) || (category === 'All' && link.textContent === 'All Items')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

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

    toggleCartDrawer(true);
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

  if (chkMapContainer) {
    chkMapContainer.addEventListener('click', (e) => {
      const rect = chkMapContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const percentX = (clickX / rect.width) * 100;
      const percentY = (clickY / rect.height) * 100;
      
      chkMapPin.style.left = `${percentX}%`;
      chkMapPin.style.top = `${percentY}%`;
      
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
      
      activeHubNode = selectedHub;
      
      currentDistance = parseFloat((Math.random() * (selectedHub.distanceRange[1] - selectedHub.distanceRange[0]) + selectedHub.distanceRange[0]).toFixed(1));
      currentEstimatedEta = Math.floor(Math.random() * (selectedHub.etaRange[1] - selectedHub.etaRange[0] + 1)) + selectedHub.etaRange[0];
      
      chkDestNode.value = selectedHub.region;
      chkDestEta.value = `${currentEstimatedEta} mins (Micro-Fulfillment)`;
      chkAddress.value = selectedHub.address;
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

      // Register order state
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
      
      // Update customer points
      walletPoints += 15;
      localStorage.setItem('velo_wallet_points', walletPoints.toString());
      
      // Add ledger history
      logWalletLedgerEvent('Catalog checkout order: +15 pts earned.');

      // Clear cart
      cart = [];
      localStorage.setItem('velo_cart', JSON.stringify(cart));
      updateCartBadge();

      showNotification(`Order placed! Order ID: ${activeOrder.id}. Transmitting delivery routing...`);
      
      switchView('tracker');
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
  renderHomepageFeatured();
  updateCartBadge();
  renderWalletData();
  renderWalletLedgerLogs();

});
