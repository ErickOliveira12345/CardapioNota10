// Gerenciamento completo do carrinho: estado, UI e persistência
const Cart = {
  items: [], // [{ ...itemData, quantidade, subtotal }]

  // ──────────────────────────────── Estado ────────────────────────────────

  load() {
    this.items = Storage.get(Storage.KEYS.CARRINHO, []);
  },

  save() {
    Storage.save(Storage.KEYS.CARRINHO, this.items);
  },

  clear() {
    this.items = [];
    this.save();
    this.render();
    this.updateBadge();
  },

  addItem(itemId) {
    const produto = MenuData.getById(Number(itemId));
    if (!produto) return;

    const existente = this.items.find(i => i.id === produto.id);
    if (existente) {
      existente.quantidade += 1;
      existente.subtotal = existente.quantidade * existente.preco;
    } else {
      this.items.push({ ...produto, quantidade: 1, subtotal: produto.preco });
    }

    this.save();
    this.render();
    this.updateBadge();
    Utils.showToast(`${produto.nome} adicionado!`, 'success', 2000);
    this.open();
  },

  removeItem(itemId) {
    this.items = this.items.filter(i => i.id !== Number(itemId));
    this.save();
    this.render();
    this.updateBadge();
  },

  updateQuantity(itemId, delta) {
    const item = this.items.find(i => i.id === Number(itemId));
    if (!item) return;

    item.quantidade = Math.max(0, item.quantidade + delta);
    if (item.quantidade === 0) {
      this.removeItem(itemId);
      return;
    }
    item.subtotal = item.quantidade * item.preco;
    this.save();
    this.render();
    this.updateBadge();
  },

  getTotal() {
    return this.items.reduce((sum, i) => sum + i.subtotal, 0);
  },

  getCount() {
    return this.items.reduce((sum, i) => sum + i.quantidade, 0);
  },

  isEmpty() {
    return this.items.length === 0;
  },

  // ──────────────────────────────── UI ────────────────────────────────────

  init() {
    this.load();
    this.render();
    this.updateBadge();
    this._bindEvents();
  },

  open() {
    document.getElementById('cart-sidebar')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('active');
    document.body.classList.add('sidebar-open');
  },

  close() {
    document.getElementById('cart-sidebar')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  },

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    const count = this.getCount();
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
    const fab = document.getElementById('cart-fab');
    if (fab) fab.classList.toggle('cart-fab--visible', count > 0);
  },

  render() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-value');
    const emptyMsg = document.getElementById('cart-empty');
    const cartFooter = document.getElementById('cart-footer');

    if (!container) return;

    if (this.isEmpty()) {
      container.innerHTML = '';
      emptyMsg && (emptyMsg.style.display = 'flex');
      cartFooter && (cartFooter.style.display = 'none');
      totalEl && (totalEl.textContent = Utils.formatCurrency(0));
      return;
    }

    emptyMsg && (emptyMsg.style.display = 'none');
    cartFooter && (cartFooter.style.display = 'block');

    container.innerHTML = this.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__emoji">${item.emoji}</div>
        <div class="cart-item__info">
          <span class="cart-item__nome">${item.nome}</span>
          <span class="cart-item__preco">${Utils.formatCurrency(item.subtotal)}</span>
        </div>
        <div class="cart-item__qty">
          <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span class="qty-value">${item.quantidade}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
      </div>
    `).join('');

    if (totalEl) totalEl.textContent = Utils.formatCurrency(this.getTotal());
  },

  _bindEvents() {
    // Botão flutuante do carrinho
    document.getElementById('cart-fab')?.addEventListener('click', () => this.open());

    // Fechar sidebar
    document.getElementById('btn-close-cart')?.addEventListener('click', () => this.close());
    document.getElementById('cart-overlay')?.addEventListener('click', () => this.close());

    // Delegação: botões de qty e add dentro do sidebar
    document.getElementById('cart-items')?.addEventListener('click', e => {
      const btn = e.target.closest('.qty-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      const delta = btn.dataset.action === 'inc' ? 1 : -1;
      this.updateQuantity(id, delta);
    });

    // Delegação: botões de adicionar no cardápio
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-add[data-item-id]');
      if (btn) this.addItem(btn.dataset.itemId);
    });

    // Finalizar pedido
    document.getElementById('btn-finalizar')?.addEventListener('click', () => Orders.createOrder());
  },
};
