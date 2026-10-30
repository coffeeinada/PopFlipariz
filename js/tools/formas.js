/**
 * PopFlipariz - Ferramenta de Formas e Linhas Avançada
 * Caminho: js/tools/formas.js
 */

export class FormasTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    // Definições das Formas
    this.tipo = 'circulo'; // 'circulo', 'poligono', 'linha', 'curva'
    this.pontosPoligono = 4; // de 3 a 10 (inclui quadrado)
    this.preencher = true;
    this.corPreenchimento = '#ffb6c1';
    this.larguraLinha = 4.0;
    this.opacidade = 1.0;
    this.modoBorracha = false;

    this.desenhando = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;

    this.escutarTecladoGlobal();
  }

  setTipo(t) { this.tipo = t || 'circulo'; }
  setPontosPoligono(p) { this.pontosPoligono = Math.max(3, Math.min(10, parseInt(p) || 4)); }
  setPreencher(p) { this.preencher = !!p; }
  setCorPreenchimento(c) { this.corPreenchimento = c || '#ffb6c1'; }
  setLarguraLinha(l) { this.larguraLinha = Math.max(0.1, Math.min(200.0, parseFloat(l) || 1.0)); }
  setOpacidade(o) { this.opacidade = Math.max(0.01, Math.min(1.0, parseFloat(o) || 1.0)); }
  setModoBorracha(m) { this.modoBorracha = !!m; }

  escutarTecladoGlobal() {
    document.addEventListener('keydown', (e) => {
      const tagAtiva = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tagAtiva === 'input' || tagAtiva === 'textarea' || tagAtiva === 'select') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        this.fixarFormaNoCanvas();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelarForma();
      }
    });
  }

  iniciarForma(e) {
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    this.startX = (e.clientX - rect.left) * (canvas.width / rect.width);
    this.startY = (e.clientY - rect.top) * (canvas.height / rect.height);
    this.currentX = this.startX;
    this.currentY = this.startY;
    this.desenhando = true;
  }

  atualizarProgresso(e) {
    if (!this.desenhando) return;
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    this.currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
    this.currentY = (e.clientY - rect.top) * (canvas.height / rect.height);
  }

  finalizarForma() {
    if (!this.desenhando) return;
    this.desenhando = false;

    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.globalAlpha = this.opacidade;

    if (this.modoBorracha) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.colorManager ? this.colorManager.corPrimaria : '#ff69b4';
      ctx.fillStyle = this.corPreenchimento;
    }

    ctx.lineWidth = this.larguraLinha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const largura = this.currentX - this.startX;
    const altura = this.currentY - this.startY;
    const raioX = Math.abs(largura) / 2;
    const raioY = Math.abs(altura) / 2;
    const centroX = this.startX + largura / 2;
    const centroY = this.startY + altura / 2;

    if (this.tipo === 'circulo') {
      ctx.beginPath();
      ctx.ellipse(centroX, centroY, raioX, raioY, 0, 0, Math.PI * 2);
      if (this.preencher && !this.modoBorracha) ctx.fill();
      if (this.larguraLinha > 0) ctx.stroke();
    } 
    else if (this.tipo === 'poligono') {
      const numPontos = this.pontosPoligono;
      const raio = Math.hypot(largura, altura) / 2;
      ctx.beginPath();
      for (let i = 0; i < numPontos; i++) {
        const angulo = (i * 2 * Math.PI) / numPontos - Math.PI / 2;
        const px = centroX + raio * Math.cos(angulo);
        const py = centroY + raio * Math.sin(angulo);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (this.preencher && !this.modoBorracha) ctx.fill();
      if (this.larguraLinha > 0) ctx.stroke();
    } 
    else if (this.tipo === 'linha') {
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.lineTo(this.currentX, this.currentY);
      if (this.larguraLinha > 0) ctx.stroke();
    } 
    else if (this.tipo === 'curva') {
      // Linha curvada suave (caminho circular/bezier)
      const meioX = (this.startX + this.currentX) / 2 - (this.currentY - this.startY) * 0.3;
      const meioY = (this.startY + this.currentY) / 2 + (this.currentX - this.startX) * 0.3;
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.quadraticCurveTo(meioX, meioY, this.currentX, this.currentY);
      if (this.larguraLinha > 0) ctx.stroke();
    }

    ctx.restore();

    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  fixarFormaNoCanvas() {
    // Confirmação explícita se necessário (a forma já entra fixada ao soltar o rato, mas o Enter serve para validar ou duplicar o fluxo)
    console.hologram ? null : console.log('Forma fixada com sucesso.');
  }

  cancelarForma() {
    if (this.historyManager) {
      this.historyManager.undo();
    }
  }
}
