/**
 * PopFlipariz - Ferramenta de Ponto de Fuga & Grade
 * Caminho: js/tools/ponto-fuga.js
 */

export class PontoFugaTool {
  constructor(canvasContainer) {
    this.canvasContainer = canvasContainer;
    this.ativarGrade = true;
    this.ativarPontoFuga = true;
    this.corGuia = '#00ffff';
    this.larguraGuia = 1.0;
    this.qtdLinhas = 16;
    
    // Posição inicial do ponto de fuga no centro do canvas
    this.pontoX = 640;
    this.pontoY = 360;

    this.arrastando = false;
    this.overlayCanvas = null;
    this.overlayCtx = null;

    this.criarOverlay();
  }

  criarOverlay() {
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = 1280;
    this.overlayCanvas.height = 720;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.pointerEvents = 'none'; // Deixa o rato passar para desenhar embaixo
    this.overlayCanvas.style.zIndex = '999';
    this.canvasContainer.appendChild(this.overlayCanvas);
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.renderizar();
  }

  setAtivarGrade(val) { this.ativarGrade = !!val; this.renderizar(); }
  setAtivarPontoFuga(val) { this.ativarPontoFuga = !!val; this.renderizar(); }
  setCorGuia(c) { this.corGuia = c || '#00ffff'; this.renderizar(); }
  setLarguraGuia(l) { this.larguraGuia = Math.max(1, Math.min(10, parseFloat(l) || 1)); this.renderizar(); }
  setQtdLinhas(q) { this.qtdLinhas = Math.max(2, Math.min(40, parseInt(q) || 16)); this.renderizar(); }

  atualizarPosicao(e, canvasAtivo) {
    if (!canvasAtivo) return;
    const rect = canvasAtivo.getBoundingClientRect();
    this.pontoX = (e.clientX - rect.left) * (canvasAtivo.width / rect.width);
    this.pontoY = (e.clientY - rect.top) * (canvasAtivo.height / rect.height);
    this.renderizar();
  }

  renderizar() {
    if (!this.overlayCtx) return;
    const w = this.overlayCanvas.width;
    const h = this.overlayCanvas.height;
    this.overlayCtx.clearRect(0, 0, w, h);

    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = this.corGuia;
    this.overlayCtx.lineWidth = this.larguraGuia;
    this.overlayCtx.globalAlpha = 0.5;

    // 1. Desenhar Grade
    if (this.ativarGrade) {
      const passo = 40;
      this.overlayCtx.beginPath();
      for (let x = 0; x <= w; x += passo) {
        this.overlayCtx.moveTo(x, 0);
        this.overlayCtx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += passo) {
        this.overlayCtx.moveTo(0, y);
        this.overlayCtx.lineTo(w, y);
      }
      this.overlayCtx.stroke();
    }

    // 2. Desenhar Ponto de Fuga
    if (this.ativarPontoFuga) {
      const totalLinhas = this.qtdLinhas;
      const pontosBorda = [];

      // Gerar pontos ao longo do perímetro da tela
      for (let i = 0; i <= totalLinhas; i++) {
        pontosBorda.push({ x: (w / totalLinhas) * i, y: 0 }); // Topo
        pontosBorda.push({ x: (w / totalLinhas) * i, y: h }); // Fundo
      }
      for (let i = 0; i <= totalLinhas; i++) {
        pontosBorda.push({ x: 0, y: (h / totalLinhas) * i }); // Esquerda
        pontosBorda.push({ x: w, y: (h / totalLinhas) * i }); // Direita
      }

      this.overlayCtx.beginPath();
      pontosBorda.forEach(pt => {
        this.overlayCtx.moveTo(this.pontoX, this.pontoY);
        this.overlayCtx.lineTo(pt.x, pt.y);
      });
      this.overlayCtx.stroke();

      // Cruz do centro do ponto de fuga
      this.overlayCtx.beginPath();
      this.overlayCtx.arc(this.pontoX, this.pontoY, 6, 0, Math.PI * 2);
      this.overlayCtx.moveTo(this.pontoX - 10, this.pontoY);
      this.overlayCtx.lineTo(this.pontoX + 10, this.pontoY);
      this.overlayCtx.moveTo(this.pontoX, this.pontoY - 10);
      this.overlayCtx.lineTo(this.pontoX, this.pontoY + 10);
      this.overlayCtx.stroke();
    }

    this.overlayCtx.restore();
  }
}
