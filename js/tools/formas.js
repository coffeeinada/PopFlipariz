/**
 * PopFlipariz - Ferramenta de Formas e Linhas com Pré-visualização e Transformação
 * Caminho: js/tools/formas.js
 */

export class FormasTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    // Definições
    this.tipo = 'circulo';
    this.pontosPoligono = 4;
    this.preencher = true;
    this.corPreenchimento = '#ffb6c1';
    this.larguraLinha = 4.0;
    this.opacidade = 1.0;
    this.modoBorracha = false;

    // Estados da ferramenta: 'ocioso' | 'desenhando' | 'transformacao'
    this.estado = 'ocioso';
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;

    // Deslocamento (posição e rotação) para mover a forma inteira antes de confirmar
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotacaoGraus = 0;
    this.arrastandoForma = false;
    this.ultimoMouseX = 0;
    this.ultimoMouseY = 0;

    // Snapshot do canvas para permitir pré-visualização fluida sem sujar a camada
    this.snapshotImageData = null;

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

      if (this.estado === 'transformacao') {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.fixarFormaNoCanvas();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.cancelarForma();
        } else if (e.key === 'r' || e.key === 'R') {
          // Atalho rápido para rodar 45 graus a cada toque na tecla R
          this.rotacaoGraus = (this.rotacaoGraus + 45) % 360;
          this.redesenharPreview();
        }
      }
    });
  }

  iniciar(e) {
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (this.estado === 'transformacao') {
      // Se já houver uma forma flutuante, verificar se o clique foi dentro para arrastá-la
      this.arrastandoForma = true;
      this.ultimoMouseX = x;
      this.ultimoMouseY = y;
      return;
    }

    // Iniciar novo desenho de forma
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.snapshotImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    this.estado = 'desenhando';
    this.startX = x;
    this.startY = y;
    this.currentX = x;
    this.currentY = y;
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotacaoGraus = 0;
  }

  mover(e) {
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (this.estado === 'desenhando') {
      this.currentX = x;
      this.currentY = y;
      this.redesenharPreview();
    } else if (this.estado === 'transformacao' && this.arrastandoForma) {
      // Mover a posição inteira da forma arrastando o rato
      const deltaX = x - this.ultimoMouseX;
      const deltaY = y - this.ultimoMouseY;
      this.offsetX += deltaX;
      this.offsetY += deltaY;
      this.ultimoMouseX = x;
      this.ultimoMouseY = y;
      this.redesenharPreview();
    }
  }

  soltar() {
    if (this.estado === 'desenhando') {
      this.estado = 'transformacao'; // Passa para o modo flutuante/ajuste
    }
    this.arrastandoForma = false;
  }

  redesenharPreview() {
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas || !this.snapshotImageData) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // Restaura o canvas para antes de desenhar a forma
    ctx.putImageData(this.snapshotImageData, 0, 0);

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

    // Aplica a translação (mover) e rotação global
    const largura = this.currentX - this.startX;
    const altura = this.currentY - this.startY;
    const centroX = this.startX + largura / 2 + this.offsetX;
    const centroY = this.startY + altura / 2 + this.offsetY;

    ctx.translate(centroX, centroY);
    ctx.rotate((this.rotacaoGraus * Math.PI) / 180);
    ctx.translate(-centroX, -centroY);

    const xLocal = this.startX + this.offsetX;
    const yLocal = this.startY + this.offsetY;
    const raioX = Math.abs(largura) / 2;
    const raioY = Math.abs(altura) / 2;
    const cx = xLocal + largura / 2;
    const cy = yLocal + altura / 2;

    if (this.tipo === 'circulo') {
      ctx.beginPath();
      ctx.ellipse(cx, cy, raioX, raioY, 0, 0, Math.PI * 2);
      if (this.preencher && !this.modoBorracha) ctx.fill();
      if (this.larguraLinha > 0) ctx.stroke();
    } 
    else if (this.tipo === 'poligono') {
      const numPontos = this.pontosPoligono;
      const raio = Math.hypot(largura, altura) / 2;
      ctx.beginPath();
      for (let i = 0; i < numPontos; i++) {
        const angulo = (i * 2 * Math.PI) / numPontos - Math.PI / 2;
        const px = cx + raio * Math.cos(angulo);
        const py = cy + raio * Math.sin(angulo);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (this.preencher && !this.modoBorracha) ctx.fill();
      if (this.larguraLinha > 0) ctx.stroke();
    } 
    else if (this.tipo === 'linha') {
      ctx.beginPath();
      ctx.moveTo(xLocal, yLocal);
      ctx.lineTo(xLocal + largura, yLocal + altura);
      if (this.larguraLinha > 0) ctx.stroke();
    } 
    else if (this.tipo === 'curva') {
      const meioX = (xLocal + (xLocal + largura)) / 2 - altura * 0.3;
      const meioY = (yLocal + (yLocal + altura)) / 2 + largura * 0.3;
      ctx.beginPath();
      ctx.moveTo(xLocal, yLocal);
      ctx.quadraticCurveTo(meioX, meioY, xLocal + largura, yLocal + altura);
      if (this.larguraLinha > 0) ctx.stroke();
    }

    ctx.restore();
  }

  fixarFormaNoCanvas() {
    if (this.estado !== 'transformacao') return;
    this.redesenharPreview(); // Garante que fica gravado definitivamente
    this.estado = 'ocioso';
    this.snapshotImageData = null;

    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  cancelarForma() {
    if (this.estado !== 'transformacao' && this.estado !== 'desenhando') return;
    const canvas = this.layerManager.obterCanvasAtivo();
    if (canvas && this.snapshotImageData) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.putImageData(this.snapshotImageData, 0, 0); // Restaura o estado original
    }
    this.estado = 'ocioso';
    this.snapshotImageData = null;
  }
}
