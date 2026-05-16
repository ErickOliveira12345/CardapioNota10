// Gerenciamento de pedidos e chamados de atendimento — lado cliente
const Orders = {
  // ──────────────────────────────── Pedidos ───────────────────────────────

  getAll() {
    return Storage.get(Storage.KEYS.PEDIDOS, []);
  },

  getByMesa(mesa) {
    return this.getAll().filter(p => p.mesa === Number(mesa));
  },

  getActivoByMesa(mesa) {
    const ativos = ['aguardando', 'recebido', 'preparando', 'saindo'];
    return this.getByMesa(mesa).find(p => ativos.includes(p.status)) || null;
  },

  createOrder() {
    const mesa = Storage.get(Storage.KEYS.MESA);
    if (!mesa) {
      Utils.showToast('Nenhuma mesa identificada. Escaneie o QR Code.', 'error');
      return;
    }

    if (Cart.isEmpty()) {
      Utils.showToast('Adicione itens ao carrinho antes de finalizar.', 'warning');
      return;
    }

    const pedido = {
      idPedido: Utils.generateId(),
      mesa: Number(mesa),
      itens: Cart.items.map(i => ({ ...i })),
      total: Cart.getTotal(),
      status: 'aguardando',
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    };

    const todos = this.getAll();
    todos.push(pedido);
    Storage.save(Storage.KEYS.PEDIDOS, todos);

    Cart.clear();
    Cart.close();
    this.renderStatus(mesa);

    Utils.showToast('Pedido enviado com sucesso! Aguarde...', 'success', 4000);
  },

  updateStatus(idPedido, novoStatus) {
    const todos = this.getAll();
    const idx = todos.findIndex(p => p.idPedido === idPedido);
    if (idx === -1) return false;
    todos[idx].status = novoStatus;
    todos[idx].atualizadoEm = Date.now();
    Storage.save(Storage.KEYS.PEDIDOS, todos);
    return true;
  },

  // ──────────────────────────────── UI Cliente ─────────────────────────────

  init(mesa) {
    this.renderStatus(mesa);
  },

  renderStatus(mesa) {
    const section = document.getElementById('pedido-status-section');
    if (!section) return;

    const pedido = this.getActivoByMesa(mesa);
    if (!pedido) {
      // Mostra histórico recente se houver pedidos finalizados
      const historico = this.getByMesa(mesa).filter(p => p.status === 'finalizado');
      if (historico.length > 0) {
        section.innerHTML = this._renderHistorico(historico);
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
      return;
    }

    section.classList.remove('hidden');
    section.innerHTML = this._renderPedidoAtivo(pedido);
  },

  _renderPedidoAtivo(pedido) {
    const st = Utils.getStatus(pedido.status);
    const steps = ['aguardando', 'recebido', 'preparando', 'saindo', 'finalizado'];
    const currentStep = steps.indexOf(pedido.status);

    const stepsHtml = steps.map((s, i) => {
      const info = Utils.getStatus(s);
      const done = i < currentStep;
      const active = i === currentStep;
      return `<div class="status-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
        <div class="status-step__dot">${active ? info.icon : (done ? '✓' : '')}</div>
        <span class="status-step__label">${info.label}</span>
      </div>`;
    }).join('');

    const itensHtml = pedido.itens.map(i =>
      `<li>${i.emoji} ${i.nome} × ${i.quantidade} — ${Utils.formatCurrency(i.subtotal)}</li>`
    ).join('');

    return `
      <div class="pedido-card">
        <div class="pedido-card__header">
          <span class="pedido-badge ${st.color}">${st.icon} ${st.label}</span>
          <span class="pedido-hora">Feito às ${Utils.formatTime(pedido.criadoEm)}</span>
        </div>
        <div class="status-track">${stepsHtml}</div>
        <details class="pedido-detalhes">
          <summary>Ver itens do pedido</summary>
          <ul class="pedido-itens">${itensHtml}</ul>
          <strong class="pedido-total">Total: ${Utils.formatCurrency(pedido.total)}</strong>
        </details>
      </div>
    `;
  },

  _renderHistorico(pedidos) {
    const ultimo = pedidos[pedidos.length - 1];
    return `
      <div class="pedido-card pedido-card--finalizado">
        <p class="pedido-card__header">
          <span class="pedido-badge status--success">✅ Pedido finalizado!</span>
          <span class="pedido-hora">${Utils.formatTime(ultimo.criadoEm)}</span>
        </p>
        <p style="color:var(--text-light);font-size:.875rem;margin-top:.5rem">
          Obrigado pela preferência! Faça um novo pedido quando quiser.
        </p>
      </div>
    `;
  },

  // ──────────────────────────────── Chamados ──────────────────────────────

  getChamados() {
    return Storage.get(Storage.KEYS.CHAMADOS, []);
  },

  requestService(mesa) {
    const chamados = this.getChamados();
    // Evita duplicar chamado ativo para a mesma mesa
    const jaExiste = chamados.some(c => c.mesa === Number(mesa) && !c.visualizado);
    if (jaExiste) {
      Utils.showToast('Chamado já enviado! Aguarde o atendimento.', 'warning');
      return;
    }

    chamados.push({ mesa: Number(mesa), timestamp: Date.now(), visualizado: false });
    Storage.save(Storage.KEYS.CHAMADOS, chamados);
    Utils.showToast('Chamado enviado! Um atendente virá até você.', 'success', 4000);
  },

  // Polling: atualiza status do pedido na tela do cliente a cada 5s
  startPolling(mesa) {
    setInterval(() => this.renderStatus(mesa), 5000);
  },
};
