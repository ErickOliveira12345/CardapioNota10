// Lógica da tela inicial: simulação de scan de QR Code
const App = {
  // Cada item representa uma mesa do restaurante
  // Em produção, cada QR Code levaria para a URL: /menu.html?mesa=N
  qrCodes: [
    { mesa: 1, imagem: '../src/img/qrcode-1.svg', descricao: 'Mesa perto da janela' },
    { mesa: 2, imagem: '../src/img/qrcode-2.svg', descricao: 'Mesa central' },
    { mesa: 3, imagem: '../src/img/qrcode-3.svg', descricao: 'Mesa no terraço' },
    { mesa: 4, imagem: '../src/img/qrcode-4.svg', descricao: 'Mesa reservada' },
  ],

  init() {
    this._renderQrGrid();
    this._checkExistingSession();
  },

  _renderQrGrid() {
    const grid = document.getElementById('qr-grid');
    if (!grid) return;

    grid.innerHTML = this.qrCodes.map(qr => `
      <div class="qr-card" data-mesa="${qr.mesa}" role="button" tabindex="0"
           aria-label="Selecionar Mesa ${qr.mesa}">
        <div class="qr-card__img-wrapper">
          <img src="${qr.imagem}" alt="QR Code Mesa ${qr.mesa}" class="qr-card__img" />
          <div class="qr-card__overlay">
            <span class="qr-scan-icon">📷 Toque para escanear</span>
          </div>
        </div>
        <div class="qr-card__footer">
          <span class="qr-card__mesa">Mesa ${qr.mesa}</span>
          <span class="qr-card__desc">${qr.descricao}</span>
        </div>
      </div>
    `).join('');

    // Evento de clique em cada QR Code
    grid.querySelectorAll('.qr-card').forEach(card => {
      const selectTable = () => this._selectTable(card.dataset.mesa);
      card.addEventListener('click', selectTable);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectTable(); });
    });
  },

  _selectTable(mesa) {
    // Feedback visual
    document.querySelectorAll('.qr-card').forEach(c => c.classList.remove('scanning'));
    const card = document.querySelector(`[data-mesa="${mesa}"]`);
    if (card) {
      card.classList.add('scanning');
      const overlay = card.querySelector('.qr-card__overlay');
      if (overlay) overlay.innerHTML = '<span class="qr-scan-icon">✓ Mesa identificada!</span>';
    }

    // Salva mesa e redireciona após animação curta
    Storage.save(Storage.KEYS.MESA, Number(mesa));
    // Limpa carrinho antigo se trocar de mesa
    Storage.remove(Storage.KEYS.CARRINHO);

    setTimeout(() => {
      window.location.href = `menu.html?mesa=${mesa}`;
    }, 800);
  },

  // Se já há uma sessão ativa, mostra banner de retorno
  _checkExistingSession() {
    const mesa = Storage.get(Storage.KEYS.MESA);
    if (!mesa) return;

    const banner = document.getElementById('session-banner');
    const mesaSpan = document.getElementById('session-mesa');
    if (banner && mesaSpan) {
      mesaSpan.textContent = mesa;
      banner.classList.remove('hidden');

      document.getElementById('btn-return-session')?.addEventListener('click', () => {
        window.location.href = `menu.html?mesa=${mesa}`;
      });

      document.getElementById('btn-new-session')?.addEventListener('click', () => {
        Storage.clear();
        banner.classList.add('hidden');
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
