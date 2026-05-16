// Dados do cardápio e lógica de renderização do menu do cliente
const MenuData = {
  categorias: [
    { id: 'bebidas',    nome: 'Bebidas',    icone: '🥤', descricao: 'Sucos, refrigerantes e drinks' },
    { id: 'porcoes',    nome: 'Porções',    icone: '🍟', descricao: 'Petiscos e entradas para compartilhar' },
    { id: 'lanches',    nome: 'Lanches',    icone: '🍔', descricao: 'Hambúrgueres e sanduíches artesanais' },
    { id: 'sobremesas', nome: 'Sobremesas', icone: '🍰', descricao: 'Doces e sobremesas irresistíveis' },
  ],

  itens: [
    // Bebidas
    { id:  1, nome: 'Coca-Cola',         preco:  8.50, descricao: 'Lata 350ml gelada',                          categoria: 'bebidas',    emoji: '🥤' },
    { id:  2, nome: 'Suco Natural',      preco: 14.00, descricao: 'Laranja, limão ou maracujá — 500ml',         categoria: 'bebidas',    emoji: '🍊' },
    { id:  3, nome: 'Heineken',          preco: 16.00, descricao: 'Long neck 330ml bem gelada',                 categoria: 'bebidas',    emoji: '🍺' },
    { id:  4, nome: 'Água Mineral',      preco:  5.00, descricao: 'Com ou sem gás 500ml',                      categoria: 'bebidas',    emoji: '💧' },
    { id:  5, nome: 'Caipirinha',        preco: 25.00, descricao: 'Cachaça artesanal, limão e açúcar',         categoria: 'bebidas',    emoji: '🍹' },
    { id:  6, nome: 'Milk Shake',        preco: 22.00, descricao: 'Chocolate, baunilha ou morango — 400ml',    categoria: 'bebidas',    emoji: '🥛' },
    // Porções
    { id:  7, nome: 'Batata Frita',      preco: 28.00, descricao: 'Porção 300g com molho especial da casa',    categoria: 'porcoes',    emoji: '🍟' },
    { id:  8, nome: 'Frango Frito',      preco: 45.00, descricao: 'Porção 400g temperado e crocante',          categoria: 'porcoes',    emoji: '🍗' },
    { id:  9, nome: 'Onion Rings',       preco: 32.00, descricao: 'Anéis de cebola empanados — 8 unid.',       categoria: 'porcoes',    emoji: '🧅' },
    { id: 10, nome: 'Bolinha de Queijo', preco: 35.00, descricao: '12 unid. com cream cheese e molho',         categoria: 'porcoes',    emoji: '🧀' },
    { id: 11, nome: 'Mix Petiscos',      preco: 58.00, descricao: 'Batata, anel e frango — serve 2 a 4',       categoria: 'porcoes',    emoji: '🍽️' },
    // Lanches
    { id: 12, nome: 'X-Burguer Clássico',preco: 32.00, descricao: 'Blend 180g, queijo prato, alface, tomate', categoria: 'lanches',    emoji: '🍔' },
    { id: 13, nome: 'X-Bacon Duplo',     preco: 42.00, descricao: 'Blend 2×180g, bacon, queijo cheddar',      categoria: 'lanches',    emoji: '🥓' },
    { id: 14, nome: 'Smash Burger',      preco: 38.00, descricao: 'Blend smash 150g, molho especial, cheddar', categoria: 'lanches',   emoji: '💥' },
    { id: 15, nome: 'Veggie Burger',     preco: 36.00, descricao: 'Blend grão-de-bico, rúcula e pesto',       categoria: 'lanches',    emoji: '🥗' },
    { id: 16, nome: 'Hot Dog Gourmet',   preco: 28.00, descricao: 'Salsicha artesanal com cremes especiais',  categoria: 'lanches',    emoji: '🌭' },
    // Sobremesas
    { id: 17, nome: 'Pudim Tradicional', preco: 18.00, descricao: 'Pudim de leite condensado com calda',      categoria: 'sobremesas', emoji: '🍮' },
    { id: 18, nome: 'Brownie + Sorvete', preco: 26.00, descricao: 'Brownie quentinho com bola de creme',      categoria: 'sobremesas', emoji: '🍫' },
    { id: 19, nome: 'Açaí 500ml',        preco: 38.00, descricao: 'Açaí cremoso com granola e frutas',        categoria: 'sobremesas', emoji: '🫐' },
    { id: 20, nome: 'Cheesecake',        preco: 28.00, descricao: 'Nova York com calda de frutas vermelhas',  categoria: 'sobremesas', emoji: '🍰' },
    { id: 21, nome: 'Petit Gateau',      preco: 32.00, descricao: 'Chocolate vulcão com sorvete de baunilha', categoria: 'sobremesas', emoji: '🎂' },
  ],

  getByCategoria(id) {
    return this.itens.filter(i => i.categoria === id);
  },

  getById(id) {
    return this.itens.find(i => i.id === id);
  },
};

// Renderização e controle de navegação do menu
const Menu = {
  categoriaAtiva: null,

  init() {
    this._renderCategorias();
    this._renderTabs();
    this._bindEvents();
  },

  // Grade de cards de categorias (tela inicial do menu)
  _renderCategorias() {
    const grid = document.getElementById('categorias-grid');
    if (!grid) return;

    grid.innerHTML = MenuData.categorias.map(cat => `
      <button class="categoria-card" data-categoria="${cat.id}" aria-label="Ver ${cat.nome}">
        <span class="categoria-card__icon">${cat.icone}</span>
        <h3 class="categoria-card__nome">${cat.nome}</h3>
        <p class="categoria-card__desc">${cat.descricao}</p>
        <span class="categoria-card__arrow">→</span>
      </button>
    `).join('');
  },

  // Abas de navegação rápida no topo
  _renderTabs() {
    const nav = document.getElementById('categorias-nav');
    if (!nav) return;

    nav.innerHTML = MenuData.categorias.map(cat => `
      <button class="categoria-tab" data-categoria="${cat.id}">
        ${cat.icone} ${cat.nome}
      </button>
    `).join('');
  },

  _bindEvents() {
    // Delegação: clique em qualquer [data-categoria] mostra os itens
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-categoria]');
      if (btn) this.showCategoria(btn.dataset.categoria);

      if (e.target.id === 'btn-back-categorias') this.showCategorias();
    });
  },

  showCategoria(categoriaId) {
    const categoria = MenuData.categorias.find(c => c.id === categoriaId);
    if (!categoria) return;

    // Atualiza abas ativas
    document.querySelectorAll('.categoria-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.categoria === categoriaId)
    );

    // Renderiza itens
    const grid = document.getElementById('itens-grid');
    const titulo = document.getElementById('categoria-titulo');
    const itensSection = document.getElementById('itens-section');
    const welcomeSection = document.getElementById('welcome-section');

    if (titulo) titulo.innerHTML = `${categoria.icone} ${categoria.nome}`;

    if (grid) {
      const itens = MenuData.getByCategoria(categoriaId);
      grid.innerHTML = itens.map(item => this._renderItemCard(item)).join('');
    }

    welcomeSection && welcomeSection.classList.add('hidden');
    itensSection && itensSection.classList.remove('hidden');
    itensSection && itensSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    this.categoriaAtiva = categoriaId;
  },

  showCategorias() {
    document.getElementById('itens-section')?.classList.add('hidden');
    document.getElementById('welcome-section')?.classList.remove('hidden');
    document.querySelectorAll('.categoria-tab').forEach(t => t.classList.remove('active'));
    this.categoriaAtiva = null;
    document.getElementById('welcome-section')?.scrollIntoView({ behavior: 'smooth' });
  },

  _renderItemCard(item) {
    return `
      <div class="item-card" data-id="${item.id}">
        <div class="item-card__emoji">${item.emoji}</div>
        <div class="item-card__info">
          <h4 class="item-card__nome">${item.nome}</h4>
          <p class="item-card__desc">${item.descricao}</p>
          <span class="item-card__preco">${Utils.formatCurrency(item.preco)}</span>
        </div>
        <button class="btn-add" data-item-id="${item.id}" aria-label="Adicionar ${item.nome}">
          <span>+</span>
        </button>
      </div>
    `;
  },
};
