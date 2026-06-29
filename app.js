document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. Perspective Switcher (Customer vs Merchant)
  // ==========================================
  const btnPerspCust = document.getElementById('btn-perspective-customer');
  const btnPerspMerch = document.getElementById('btn-perspective-merchant');
  
  const groupCustTabs = document.getElementById('group-customer-tabs');
  const groupMerchTabs = document.getElementById('group-merchant-tabs');
  
  const navButtons = document.querySelectorAll('.sandbox-nav-btn');
  const panels = document.querySelectorAll('.sandbox-panel');

  if (btnPerspCust && btnPerspMerch) {
    // Switch to Customer View
    btnPerspCust.addEventListener('click', () => {
      btnPerspCust.classList.add('active');
      btnPerspMerch.classList.remove('active');
      
      groupCustTabs.classList.remove('hidden');
      groupMerchTabs.classList.add('hidden');
      
      // Reset active tab to Customer Catalog
      setActiveConsoleTab('sb-nav-catalog', 'panel-catalog');
    });

    // Switch to Merchant View
    btnPerspMerch.addEventListener('click', () => {
      btnPerspMerch.classList.add('active');
      btnPerspCust.classList.remove('active');
      
      groupMerchTabs.classList.remove('hidden');
      groupCustTabs.classList.add('hidden');
      
      // Reset active tab to Merchant Pricing & VAT
      setActiveConsoleTab('sb-nav-pricing', 'panel-pricing');
    });
  }

  // Helper to force-activate tab and panel
  function setActiveConsoleTab(btnId, panelId) {
    navButtons.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    
    const targetBtn = document.getElementById(btnId);
    const targetPanel = document.getElementById(panelId);
    
    if (targetBtn) targetBtn.classList.add('active');
    if (targetPanel) targetPanel.classList.add('active');
  }

  // ==========================================
  // 2. Individual Tab Switcher (Sidebar clicks)
  // ==========================================
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Clear active class from buttons under active group
      const activeGroup = btn.parentElement;
      activeGroup.querySelectorAll('.sandbox-nav-btn').forEach(b => b.classList.remove('active'));
      
      btn.classList.add('active');

      // Hide all panels
      panels.forEach(p => p.classList.remove('active'));
      
      // Show matching panel
      const targetPanelId = btn.id.replace('sb-nav-', 'panel-');
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.add('active');
        
        // Focus first OTP field if verifying
        if (targetPanelId === 'panel-login') {
          setTimeout(() => {
            const firstOtpInput = document.querySelector('.otp-box-input');
            if (firstOtpInput) firstOtpInput.focus();
          }, 100);
        }
      }
    });
  });

  // ==========================================
  // 3. Customer Catalog & Shopping Cart
  // ==========================================
  let cartItems = [];
  const cartList = document.getElementById('cart-list');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartVat = document.getElementById('cart-vat');
  const cartTotal = document.getElementById('cart-total');
  const btnPlaceOrder = document.getElementById('btn-place-order');

  window.addToCart = function(name, price) {
    cartItems.push({
      id: Date.now() + Math.random(),
      name: name,
      price: price
    });
    renderCart();
  };

  window.removeFromCart = function(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    renderCart();
  };

  function renderCart() {
    if (cartItems.length === 0) {
      cartList.innerHTML = `<p class="text-muted text-center" style="font-size: 0.85rem; padding: 20px 0;">Cart is empty. Click items to add.</p>`;
      cartSubtotal.textContent = 'AED 0.00';
      cartVat.textContent = 'AED 0.00';
      cartTotal.textContent = 'AED 0.00';
      btnPlaceOrder.disabled = true;
      return;
    }

    cartList.innerHTML = '';
    let total = 0;
    
    cartItems.forEach(item => {
      total += item.price;
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <span>${escapeHTML(item.name)}</span>
        <div>
          <span>AED ${item.price.toFixed(2)}</span>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
        </div>
      `;
      cartList.appendChild(row);
    });

    const netVal = total / 1.05;
    const vatVal = total - netVal;

    cartSubtotal.textContent = `AED ${netVal.toFixed(2)}`;
    cartVat.textContent = `AED ${vatVal.toFixed(2)}`;
    cartTotal.textContent = `AED ${total.toFixed(2)}`;
    btnPlaceOrder.disabled = false;
  }

  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', () => {
      const orderVal = cartTotal.textContent;
      alert(`Order placed successfully! Total: ${orderVal}. Transmitting logistics coordinates to your nearest warehouse hub...`);
      
      // Reset Cart
      cartItems = [];
      renderCart();

      // Trigger reward points
      custPoints += 15;
      updateCustWalletUI();
      logCustWalletMsg('Checkout processed. Shopping Points earned: +15 pts');

      // Auto-advance customer view to Georouting Dispatch Map (Tab 2)
      setActiveConsoleTab('sb-nav-geotag', 'panel-geotag');
    });
  }

  // ==========================================
  // 4. Customer Georouting Dispatch (Map click)
  // ==========================================
  const mapCanvasContainer = document.getElementById('map-canvas-container');
  const mapMainPin = document.getElementById('map-main-pin');
  
  const coordEta = document.getElementById('coord-eta');
  const coordRegion = document.getElementById('coord-region');
  const coordLat = document.getElementById('coord-lat');
  const coordLong = document.getElementById('coord-long');
  const coordAddress = document.getElementById('coord-address');
  
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

  if (mapCanvasContainer) {
    mapCanvasContainer.addEventListener('click', (e) => {
      const rect = mapCanvasContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const percentX = (clickX / rect.width) * 100;
      const percentY = (clickY / rect.height) * 100;
      
      mapMainPin.style.left = `${percentX}%`;
      mapMainPin.style.top = `${percentY}%`;
      
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
      
      const offsetLat = (50 - percentY) * 0.0005;
      const offsetLong = (percentX - 50) * 0.0005;
      
      const currentLat = selectedHub.latBase + offsetLat;
      const currentLong = selectedHub.longBase + offsetLong;
      
      const distance = (Math.random() * (selectedHub.distanceRange[1] - selectedHub.distanceRange[0]) + selectedHub.distanceRange[0]).toFixed(1);
      const eta = Math.floor(Math.random() * (selectedHub.etaRange[1] - selectedHub.etaRange[0] + 1)) + selectedHub.etaRange[0];
      
      coordEta.textContent = `${eta} mins (Micro-Fulfillment)`;
      coordRegion.textContent = selectedHub.region;
      coordLat.textContent = `${distance} km`;
      coordLong.textContent = `${currentLat.toFixed(4)}° N, ${currentLong.toFixed(4)}° E`;
      coordAddress.textContent = selectedHub.address;
      
      logCustWalletMsg(`Delivery transit mapped from ${selectedHub.region} (${eta} min delivery target).`);
    });
  }

  // ==========================================
  // 5. Customer Rewards Wallet Simulator
  // ==========================================
  const btnCustReferral = document.getElementById('btn-cust-trigger-referral');
  const btnCustPurchase = document.getElementById('btn-cust-trigger-purchase');
  const btnCustReset = document.getElementById('btn-cust-trigger-reset');
  
  const custWalletBalance = document.getElementById('cust-wallet-balance');
  const custWalletPoints = document.getElementById('cust-wallet-points');
  const custWalletReferrals = document.getElementById('cust-wallet-referrals');
  const custWalletLogList = document.getElementById('cust-wallet-log-list');

  // Customer Wallet State
  let custBalance = 140.00;
  let custPoints = 340;
  let custReferrals = 4;

  function updateCustWalletUI() {
    custWalletBalance.textContent = `AED ${custBalance.toFixed(2)}`;
    custWalletPoints.textContent = `${custPoints} pts`;
    custWalletReferrals.textContent = custReferrals;
  }

  function logCustWalletMsg(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log = document.createElement('div');
    log.className = 'log-entry';
    log.innerHTML = `
      <span class="log-time">${time}</span>
      <span class="log-msg">${escapeHTML(msg)}</span>
    `;
    custWalletLogList.insertBefore(log, custWalletLogList.firstChild);
    if (custWalletLogList.children.length > 4) {
      custWalletLogList.removeChild(custWalletLogList.lastChild);
    }
  }

  if (btnCustReferral) {
    btnCustReferral.addEventListener('click', () => {
      custBalance += 25.00;
      custPoints += 50;
      custReferrals += 1;
      updateCustWalletUI();
      logCustWalletMsg('Referral confirmed. Reward bonus credited: +AED 25.00 / +50 pts');
    });
  }

  if (btnCustPurchase) {
    btnCustPurchase.addEventListener('click', () => {
      custPoints += 15;
      updateCustWalletUI();
      logCustWalletMsg('Checkout order processed. Shopping points earned: +15 pts');
    });
  }

  if (btnCustReset) {
    btnCustReset.addEventListener('click', () => {
      custBalance = 140.00;
      custPoints = 340;
      custReferrals = 4;
      updateCustWalletUI();
      custWalletLogList.innerHTML = `<div class="log-entry"><span class="log-time">System</span><span class="log-msg">Wallet ledgers reset.</span></div>`;
    });
  }

  // ==========================================
  // 6. Returns Policy visibility (CMS Panel)
  // ==========================================
  const policyToggle = document.getElementById('policy-visibility-toggle');
  const policyStatusLbl = document.getElementById('policy-status-lbl');
  const publicPolicyBadge = document.getElementById('public-policy-badge');
  const publicPolicyBody = document.getElementById('public-policy-body');

  if (policyToggle) {
    policyToggle.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      
      if (isVisible) {
        policyStatusLbl.textContent = 'Storefront Public';
        publicPolicyBadge.textContent = 'Active & Visible';
        publicPolicyBadge.className = 'badge bg-green';
        
        publicPolicyBody.innerHTML = `
          <div class="active-storefront-policies" style="animation: fadeIn 0.4s ease forwards;">
            <div class="policy-clause">
              <h5>Storefront Return Window</h5>
              <p>Under platform compliance rules, return submissions are accepted within 15 days of dispatch. Refunds settle back to the original funding card.</p>
            </div>
            <div class="policy-clause" style="margin-bottom: 0;">
              <h5>Fulfillment Route Cancellation</h5>
              <p>For micro-fulfillment orders (under 15-minute dispatch SLA), cancellations are accepted solely prior to node warehouse dispatch.</p>
            </div>
          </div>
        `;
        logCustWalletMsg('Storefront returns visibility toggled to Public.');
      } else {
        policyStatusLbl.textContent = 'Admin View Only';
        publicPolicyBadge.textContent = 'Hidden';
        publicPolicyBadge.className = 'badge';
        
        publicPolicyBody.innerHTML = `
          <div class="policy-placeholder" style="animation: fadeIn 0.4s ease forwards;">
            <div class="locked-icon">🔒</div>
            <p>Return policy information is currently set to hidden on customer-facing pages. Customer queries route to CS chat modules.</p>
          </div>
        `;
        logCustWalletMsg('Storefront returns visibility restricted to Admin only.');
      }
    });
  }

  // ==========================================
  // 7. Merchant pricing & margin calculator
  // ==========================================
  const baseCostInput = document.getElementById('base-cost');
  const marginSlider = document.getElementById('margin-slider');
  const marginValLabel = document.getElementById('margin-val');
  
  const resCustPrice = document.getElementById('res-cust-price');
  const resMarginVal = document.getElementById('res-margin-val');
  const resVatVal = document.getElementById('res-vat-val');
  const resNetVal = document.getElementById('res-net-val');

  function calculatePricing() {
    const baseCost = parseFloat(baseCostInput.value) || 0;
    const marginPercent = parseFloat(marginSlider.value) / 100;
    
    marginValLabel.textContent = `${(marginPercent * 100).toFixed(1)}%`;
    
    const marginEarned = baseCost * marginPercent;
    const netBase = baseCost + marginEarned;
    const vatInclusiveTotal = netBase * 1.05; 
    const vatAmount = vatInclusiveTotal - netBase;
    
    resCustPrice.textContent = `AED ${vatInclusiveTotal.toFixed(2)}`;
    resMarginVal.textContent = `+AED ${marginEarned.toFixed(2)}`;
    resVatVal.textContent = `AED ${vatAmount.toFixed(2)}`;
    resNetVal.textContent = `AED ${netBase.toFixed(2)}`;
  }

  if (baseCostInput && marginSlider) {
    baseCostInput.addEventListener('input', calculatePricing);
    marginSlider.addEventListener('input', calculatePricing);
    calculatePricing();
  }

  // ==========================================
  // 8. Merchant inventory upload & validation
  // ==========================================
  const btnUploadProdMerch = document.getElementById('btn-upload-prod-merchant');
  const prodNameMerch = document.getElementById('prod-name-merchant');
  const prodCategoryMerch = document.getElementById('prod-category-merchant');
  const prodPriceMerch = document.getElementById('prod-price-merchant');
  const pipelineListMerch = document.getElementById('pipeline-list-merchant');
  let mockProdCount = 1;

  setupApprovalActionButtons('mock-prod-1');

  if (btnUploadProdMerch) {
    btnUploadProdMerch.addEventListener('click', () => {
      const name = prodNameMerch.value.trim();
      const category = prodCategoryMerch.options[prodCategoryMerch.selectedIndex].text;
      const price = parseFloat(prodPriceMerch.value) || 0;
      
      if (!name) {
        alert('Please enter a product title.');
        return;
      }

      mockProdCount++;
      const uniqueId = `mock-prod-${mockProdCount}`;
      
      const item = document.createElement('div');
      item.className = 'pipeline-item pending';
      item.id = uniqueId;
      item.innerHTML = `
        <div class="pipeline-info">
          <div class="pipeline-title">${escapeHTML(name)}</div>
          <div class="pipeline-meta">${escapeHTML(category)} | AED ${price.toFixed(2)}</div>
        </div>
        <div class="pipeline-badge">Verification Pending</div>
        <div class="pipeline-actions">
          <button class="btn-icon btn-approve" id="approve-${uniqueId}" title="Approve">✓</button>
          <button class="btn-icon btn-reject" id="reject-${uniqueId}" title="Reject">✗</button>
        </div>
      `;
      
      pipelineListMerch.insertBefore(item, pipelineListMerch.firstChild);
      setupApprovalActionButtons(uniqueId);
      prodNameMerch.value = '';
    });
  }

  function setupApprovalActionButtons(id) {
    const approveBtn = document.getElementById(`approve-${id}`);
    const rejectBtn = document.getElementById(`reject-${id}`);
    
    if (approveBtn) {
      approveBtn.addEventListener('click', () => approveProduct(id));
    }
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => rejectProduct(id));
    }
  }

  window.approveProduct = function(id) {
    const item = document.getElementById(id);
    if (item) {
      item.className = 'pipeline-item approved';
      const badge = item.querySelector('.pipeline-badge');
      badge.textContent = 'Approved & Synced';
      const actions = item.querySelector('.pipeline-actions');
      if (actions) actions.remove();
      
      logMerchWalletMsg('Inventory verification complete. Product stocked in micro-fulfillment node.');
    }
  };

  window.rejectProduct = function(id) {
    const item = document.getElementById(id);
    if (item) {
      item.className = 'pipeline-item rejected';
      const badge = item.querySelector('.pipeline-badge');
      badge.textContent = 'Rejected';
      const actions = item.querySelector('.pipeline-actions');
      if (actions) actions.remove();
      
      logMerchWalletMsg('Inventory verification failed. Item rejected.');
    }
  };

  // ==========================================
  // 9. Merchant Access Verification (OTP)
  // ==========================================
  const btnSendOtp = document.getElementById('btn-send-otp');
  const btnVerifyOtp = document.getElementById('btn-verify-otp');
  const btnResetOtpFlow = document.getElementById('btn-reset-otp-flow');
  
  const otpStep1 = document.getElementById('otp-step-1');
  const otpStep2 = document.getElementById('otp-step-2');
  const otpStepSuccess = document.getElementById('otp-step-success');
  
  const otpPhoneInput = document.getElementById('otp-phone');
  const otpEmailInput = document.getElementById('otp-email');
  const otpTargetPhone = document.getElementById('otp-target-phone');
  const otpBoxInputs = document.querySelectorAll('.otp-box-input');

  if (btnSendOtp) {
    btnSendOtp.addEventListener('click', () => {
      const phone = otpPhoneInput.value.trim();
      const email = otpEmailInput.value.trim();
      
      if (!phone || !email) {
        alert('Please fill in all verification fields.');
        return;
      }
      
      otpTargetPhone.textContent = `+971 ${phone}`;
      
      otpStep1.classList.add('hidden');
      otpStep2.classList.remove('hidden');
      
      setTimeout(() => {
        otpBoxInputs[0].focus();
      }, 50);
    });
  }

  otpBoxInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length === 1 && index < otpBoxInputs.length - 1) {
        otpBoxInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
        otpBoxInputs[index - 1].focus();
      }
    });
  });

  if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', () => {
      let code = '';
      otpBoxInputs.forEach(input => code += input.value);
      
      if (code.length < 6) {
        alert('Please enter the 6-digit access code.');
        return;
      }
      
      otpStep2.classList.add('hidden');
      otpStepSuccess.classList.remove('hidden');
      
      logMerchWalletMsg('Identity token registered. Security verification successful.');
    });
  }

  if (btnResetOtpFlow) {
    btnResetOtpFlow.addEventListener('click', () => {
      otpPhoneInput.value = '';
      otpEmailInput.value = '';
      otpBoxInputs.forEach(input => input.value = '');
      
      otpStepSuccess.classList.add('hidden');
      otpStep1.classList.remove('hidden');
    });
  }

  // ==========================================
  // 10. Merchant Settlements Wallet Simulator
  // ==========================================
  const btnMerchReferral = document.getElementById('btn-merchant-trigger-referral');
  const btnMerchSale = document.getElementById('btn-merchant-trigger-sale');
  const btnMerchReset = document.getElementById('btn-merchant-trigger-reset');
  
  const merchantWalletBalance = document.getElementById('merchant-wallet-balance');
  const merchantWalletPending = document.getElementById('merchant-wallet-pending');
  const merchantWalletReferrals = document.getElementById('merchant-wallet-referrals');
  const merchantWalletLogList = document.getElementById('merchant-wallet-log-list');

  // Merchant Wallet State
  let merchBalance = 1482.50;
  let merchPending = 25.00;
  let merchReferrals = 12;

  function updateMerchWalletUI() {
    merchantWalletBalance.textContent = `AED ${merchBalance.toFixed(2)}`;
    merchantWalletPending.textContent = `AED ${merchPending.toFixed(2)}`;
    merchantWalletReferrals.textContent = merchReferrals;
  }

  function logMerchWalletMsg(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log = document.createElement('div');
    log.className = 'log-entry';
    log.innerHTML = `
      <span class="log-time">${time}</span>
      <span class="log-msg">${escapeHTML(msg)}</span>
    `;
    merchantWalletLogList.insertBefore(log, merchantWalletLogList.firstChild);
    if (merchantWalletLogList.children.length > 4) {
      merchantWalletLogList.removeChild(merchantWalletLogList.lastChild);
    }
  }

  if (btnMerchReferral) {
    btnMerchReferral.addEventListener('click', () => {
      merchBalance += 25.00;
      merchPending += 25.00;
      merchReferrals += 1;
      updateMerchWalletUI();
      logMerchWalletMsg('Merchant partner registered. Margin credit queued: +AED 25.00');
    });
  }

  if (btnMerchSale) {
    btnMerchSale.addEventListener('click', () => {
      const randomBasePrice = Math.floor(Math.random() * (150 - 30 + 1)) + 30; // 30-150 AED
      const randomMarginPercent = (Math.random() * (5.0 - 3.0) + 3.0) / 100; // 3% to 5%
      const marginCalculated = randomBasePrice * randomMarginPercent;
      
      merchBalance += marginCalculated;
      updateMerchWalletUI();
      logMerchWalletMsg(`Order logged (Wholesale value AED ${randomBasePrice}): Margin split +AED ${marginCalculated.toFixed(2)}`);
    });
  }

  if (btnMerchReset) {
    btnMerchReset.addEventListener('click', () => {
      merchBalance = 1482.50;
      merchPending = 25.00;
      merchReferrals = 12;
      updateMerchWalletUI();
      merchantWalletLogList.innerHTML = `<div class="log-entry"><span class="log-time">System</span><span class="log-msg">Settlement logs reset.</span></div>`;
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

});
