/**
 * PopFlipariz - Ferramenta de Ponto de Fuga e Grade Guia
 * Caminho: js/tools/ponto-fuga.js
 */

export class PontoFugaTool {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.ativarGrade = false;     // Inicia desligado para não poluir a tela
    this.ativarPontoFuga = false; // Inicia desligado
    this.corGuia = '#ff69b4';
    this.larguraGuia = 1;
    this.qtdLinhas = 8;
    this.pontoX = 640;
    this.pontoY = 360;

    this.criarOverlayGuia();
  }

  criarOverlayGuia() {
    let overlay = document.getElementById('ponto-fuga-overlay');
    if (!overlay) {
      overlay = document.createElement('canvas');
      overlay.id = 'ponto-fuga-overlay';
      overlay.width = 1280;
      overlay.height = 720;
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '999';
      this.container.appendChild(overlay);
    }
    this.overlayCanvas = overlay;
    this.overlayCtx = overlay.getContext('2d');
    this.redesenharGuia();
  }

  setAtivarGrade(valor) {
    this.ativarGrade = valor;
    this.redesenharGuia();
  }

  setAtivarPontoFuga(valor) {
    this.ativarPontoFuga = valor;
    this.redesenharGuia();
  }

  setCorGuia(cor) {
    this.corGuia = cor;
    this.redesenharGuia();
  }

  setLarguraGuia(largura) {
    this.larguraGuia = parseInt(largura) || 1;
    this.redesenharGuia();
  }

  setQtdLinhas(qtd) {
    this.qtdLinhas = parseInt(qtd) || 8;
    this.redesenharGuia();
  }

  atualizarPosicao(e, canvasAtivo) {
    if (!this.ativarPontoFuga || !canvasAtivo) return;
    const rect = canvasAtivo.getBoundingClientRect();
    this.pontoX = (e.clientX - rect.left) * (canvasAtivo.width / rect.width);
    this.pontoY = (e.clientY - rect.top) * (canvasAtivo.height / rect.height);
    this.redesenharGuia();
  }

  redesenharGuia() {
    if (!this.overlayCtx) return;
    const ctx = this.overlayCtx;
    ctx.clearRect(0, 0, 1280, 720);

    if (!this.ativarGrade && !this.ativarPontoFuga) return;

    ctx.strokeStyle = this.corGuia;
    ctx.lineWidth = this.larguraGuia;

    // Desenhar Grade se ativada
    if (this.ativarGrade) {
      ctx.globalAlpha = 0.3;
      const passo = 80;
      for (let x = 0; x <= 1280; x += passo) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      for (let y = 0; y <= 720; y += passo) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }
    }

    // Desenhar Linhas do Ponto de Fuga se ativadas
    if (this.ativarPontoFuga) {
      ctx.globalAlpha = 0.6;
      const passos = this.qtdLinhas * 4;
      for (let i = 0; i < passos; i++) {
        const angulo = (i / passos) * Math.PI * 2;
        const xFim = this.pontoX + Math.cos(angulo) * 2000;
        const yFim = this.pontoY + Math.sin(angulo) * 2000;

        ctx.beginPath();
        ctx.moveTo(this.pontoX, this.pontoY);
        ctx.lineTo(xFim, yFim);
        ctx.stroke();
      }

      ctx.fillStyle = this.corGuia;
      ctx.beginPath();
      ctx.arc(this.pontoX, this.pontoY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}
