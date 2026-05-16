// Painel administrativo do estabelecimento
const Admin = {
  filtroAtivo: 'todos',
  _pollInterval: null,

  // ──────────────────────────────── Init ──────────────────────────────────

  init() {
    this._bindEvents();
    this.refresh();
    this.startPolling();
  },

  refresh() {
    this._renderStats();
    this._renderAlertas();
    this._renderPedidos();
  },

  startPolling() {
    // Sincroniza com mudanças no localStorage feitas pelo cliente a cada 4s
    this._pollInterval = setInterval(() => this.refresh(), 4000);
  },

  // ──────────────────────────────── Stats ─────────────────────────────────

  _renderStats() {
    const pedidos = Orders.getAll();
    const chamados = Orders.getChamados().filter(c => !c.visualizado);

    const counts = {
      total:      pedidos.length,
      aguardando: pedidos.filter(p => p.status === 'aguardando').length,
      preparando: pedidos.filter(p => p.status === 'preparando').length,
      finalizado: pedidos.filter(p => p.status === 'finalizado').length,
      chamados:   chamados.length,
    };

    this._setEl('stat-total',      counts.total);
    this._setEl('stat-aguardando', counts.aguardando);
    this._setEl('stat-preparando', counts.preparando);
    this._setEl('stat-finalizado', counts.finalizado);
    this._setEl('stat-chamados',   counts.chamados);
  },

  _setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },

  // ──────────────────────────────── Alertas ───────────────────────────────

  _renderAlertas() {
    const section = document.getElementById('alertas-section');
    const grid = document.getElementById('alertas-grid');
    if (!grid) return;

    const chamados = Orders.getChamados().filter(c => !c.visualizado);

    if (chamados.length === 0) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');

    grid.innerHTML = chamados.map(c => `
      <div class="alerta-card">
        <div class="alerta-card__pulse"></div>
        <div class="alerta-card__body">
          <span class="alerta-mesa">🔔 Mesa ${c.mesa} solicita atendimento</span>
          <span class="alerta-hora">${Utils.timeSince(c.timestamp)}</span>
        </div>
        <button class="btn-visualizado" data-mesa="${c.mesa}" data-ts="${c.timestamp}">
          Marcar como atendido
        </button>
      </div>
    `).join('');
  },

  _markVisualizado(mesa, ts) {
    const chamados = Orders.getChamados();
    const idx = chamados.findIndex(c => c.mesa === Number(mesa) && c.timestamp === Number(ts));
    if (idx !== -1) {
      chamados[idx].visualizado = true;
      Storage.save(Storage.KEYS.CHAMADOS, chamados);
      Utils.showToast(`Mesa ${mesa} marcada como atendida.`, 'success');
      this.refresh();
    }
  },

  // ──────────────────────────────── Pedidos ───────────────────────────────

  _renderPedidos() {
    const grid = document.getElementById('pedidos-grid');
    if (!grid) return;

    let pedidos = Orders.getAll().sort((a, b) => b.criadoEm - a.criadoEm);

    if (this.filtroAtivo !== 'todos') {
      pedidos = pedidos.filter(p => p.status === this.filtroAtivo);
    }

    if (pedidos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📋</span>
          <p>Nenhum pedido ${this.filtroAtivo !== 'todos' ? 'com esse status ' : ''}ainda.</p>
        </div>`;
      return;
    }

    grid.innerHTML = pedidos.map(p => this._renderPedidoCard(p)).join('');
  },

  _renderPedidoCard(pedido) {
    const st = Utils.getStatus(pedido.status);
    const statusOptions = Object.entries(Utils.STATUS)
      .map(([key, val]) => `<option value="${key}" ${pedido.status === key ? 'selected' : ''}>${val.icon} ${val.label}</option>`)
      .join('');

    const itensHtml = pedido.itens.map(i =>
      `<li class="pedido-item-row">
         <span>${i.emoji} ${i.nome}</span>
         <span>×${i.quantidade}</span>
         <span>${Utils.formatCurrency(i.subtotal)}</span>
       </li>`
    ).join('');

    return `
      <div class="pedido-card-admin ${st.color.replace('status--', 'card--')}" data-id="${pedido.idPedido}">
        <div class="pedido-card-admin__header">
          <div class="pedido-card-admin__meta">
            <span class="admin-mesa-badge">Mesa ${pedido.mesa}</span>
            <span class="admin-pedido-id">#${pedido.idPedido.slice(0, 8)}</span>
          </div>
          <span class="admin-status-badge ${st.color}">${st.icon} ${st.label}</span>
        </div>

        <ul class="admin-itens-list">${itensHtml}</ul>

        <div class="pedido-card-admin__footer">
          <div class="admin-footer-meta">
            <span class="admin-hora">🕐 ${Utils.formatDateTime(pedido.criadoEm)}</span>
            <span class="admin-total">${Utils.formatCurrency(pedido.total)}</span>
          </div>
          <div class="admin-status-select-wrap">
            <label>Alterar status:</label>
            <select class="admin-status-select" data-id="${pedido.idPedido}">
              ${statusOptions}
            </select>
          </div>
        </div>
      </div>
    `;
  },

  // ──────────────────────────────── Eventos ───────────────────────────────

  _bindEvents() {
    // Filtros de status
    document.getElementById('filtros-pedidos')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-filtro]');
      if (!btn) return;
      this.filtroAtivo = btn.dataset.filtro;
      document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this._renderPedidos();
    });

    // Delegação: mudança de status nos selects dos pedidos
    document.getElementById('pedidos-grid')?.addEventListener('change', e => {
      const select = e.target.closest('.admin-status-select');
      if (!select) return;
      const id = select.dataset.id;
      const novoStatus = select.value;
      Orders.updateStatus(id, novoStatus);
      Utils.showToast(`Status atualizado para: ${Utils.getStatus(novoStatus).label}`, 'info');
      setTimeout(() => this.refresh(), 300);
    });

    // Delegação: marcar chamado como visualizado
    document.getElementById('alertas-grid')?.addEventListener('click', e => {
      const btn = e.target.closest('.btn-visualizado');
      if (btn) this._markVisualizado(btn.dataset.mesa, btn.dataset.ts);
    });

    // Limpar todos os dados (demo)
    document.getElementById('btn-clear-all')?.addEventListener('click', () => {
      if (!confirm('Limpar TODOS os dados? (Pedidos, chamados e sessões)')) return;
      Storage.clear();
      Utils.showToast('Dados resetados com sucesso.', 'success');
      this.refresh();
    });
  },
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
