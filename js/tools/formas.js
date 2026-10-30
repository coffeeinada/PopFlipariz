/**
 * PopFlipariz - Ferramenta de Formas com Transformação Livre e Escala Proporcional (Shift)
 * Caminho: js/tools/formas.js
 */

export class FormasTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    this.tipo = 'circulo';
    this.pontosPoligono = 4;
    this.preencher = true;
    this.corPreenchimento = '#ffb6c1';
    this.larguraLinha = 4.0;
    this.opacidade = 1.0;
    this.modoBorracha = false;

    this.estado = 'ocioso';
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;

    this.translateX = 0;
    this.translateY = 0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.skewX = 0.0;
    this.skewY = 0.0;
    this.rotacaoGraus = 0;

    this.subAcao = 'nenhum';
    this.ultimoMouseX = 0;
    this.ultimoMouseY = 0;

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
      const minX = Math.min(this.startX, this.currentX);
      const maxX = Math.max(this.startX, this.currentX);
      const minY = Math.min(this.startY, this.currentY);
      const maxY = Math.max(this.startY, this.currentY);
      const centerX = (minX + maxX) / 2 + this.translateX;
      const centerY = (minY + maxY) / 2 + this.translateY;
      const raioY = (maxY - minY) / 2;

      const handleRotX = centerX;
      const handleRotY = centerY - raioY * this.scaleY - 25;
      if (Math.hypot(x - handleRotX, y - handleRotY) < 12) {
        this.subAcao = 'rotacionando';
      } else if (Math.abs(x - centerX) < 15 && Math.abs(y - minY) < 10) {
        this.subAcao = 'inclinando';
      } else if (Math.abs(x - maxX) < 12 && Math.abs(y - maxY) < 12) {
        this.subAcao = 'escalando';
      } else if (x >= minX + this.translateX && x <= maxX + this.translateX && y >= minY + this.translateY && y <= maxY + this.translateY) {
        this.subAcao = 'movendo';
      } else {
        this.subAcao = 'nenhum';
        return;
      }

      this.ultimoMouseX = x;
      this.ultimoMouseY = y;
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.snapshotImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    this.estado = 'desenhando';
    this.startX = x;
    this.startY = y;
    this.currentX = x;
    this.currentY = y;
    this.translateX = 0;
    this.translateY = 0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.skewX = 0.0;
    this.skewY = 0.0;
    this.rotacaoGraus = 0;
    this.subAcao = 'nenhum';
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
      this.redesenharPreview(e);
    } else if (this.estado === 'transformacao') {
      const deltaX = x - this.ultimoMouseX;
      const deltaY = y - this.ultimoMouseY;

      const minX = Math.min(this.startX, this.currentX);
      const maxX = Math.max(this.startX, this.currentX);
      const minY = Math.min(this.startY, this.currentY);
      const maxY = Math.max(this.startY, this.currentY);
      const centerX = (minX + maxX) / 2 + this.translateX;
      const centerY = (minY + maxY) / 2 + this.translateY;

      if (this.subAcao === 'movendo') {
        this.translateX += deltaX;
        this.translateY += deltaY;
      } else if (this.subAcao === 'rotacionando') {
        const anguloRad = Math.atan2(y - centerY, x - centerX);
        this.rotacaoGraus = (anguloRad * 180) / Math.PI + 90;
      } else if (this.subAcao === 'escalando') {
        const larguraBase = maxX - minX || 1;
        const alturaBase = maxY - minY || 1;
        this.scaleX = Math.max(0.1, this.scaleX + deltaX / larguraBase);
        this.scaleY = Math.max(0.1, this.scaleY + deltaY / alturaBase);

        // Se o Shift estiver premido, escala uniformemente (mantém proporção)
        if (e.shiftKey) {
          const uniform = Math.max(this.scaleX, this.scaleY);
          this.scaleX = uniform;
          this.scaleY = uniform;
        }
      } else if (this.subAcao === 'inclinando') {
        this.skewX += deltaX * 0.02;
      }

      this.ultimoMouseX = x;
      this.ultimoMouseY = y;
      this.redesenharPreview(e);
    }
  }

  soltar() {
    if (this.estado === 'desenhando') {
      this.estado = 'transformacao';
    }
    this.subAcao = 'nenhum';
  }

  redesenharPreview(e = {}) {
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas || !this.snapshotImageData) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

    const minX = Math.min(this.startX, this.currentX);
    const maxX = Math.max(this.startX, this.currentX);
    const minY = Math.min(this.startY, this.currentY);
    const maxY = Math.max(this.startY, this.currentY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    ctx.translate(centerX + this.translateX, centerY + this.translateY);
    ctx.rotate((this.rotacaoGraus * Math.PI) / 180);
    ctx.transform(this.scaleX, this.skewY, this.skewX, this.scaleY, 0, 0);
    ctx.translate(-centerX, -centerY);

    const largura = maxX - minX;
    const altura = maxY - minY;
    const raioX = largura / 2;
    const raioY = altura / 2;
    const cx = minX + raioX;
    const cy = minY + raioY;

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
      ctx.moveTo(minX, minY);
      ctx.lineTo(maxX, maxY);
      if (this.larguraLinha > 0) ctx.stroke();
    } 
    else if (this.tipo === 'curva') {
      const meioX = (minX + maxX) / 2 - altura * 0.3;
      const meioY = (minY + maxY) / 2 + largura * 0.3;
      ctx.beginPath();
      ctx.moveTo(minX, minY);
      ctx.quadraticCurveTo(meioX, meioY, maxX, maxY);
      if (this.larguraLinha > 0) ctx.stroke();
    }

    if (this.estado === 'transformacao') {
      ctx.restore();
      ctx.save();
      ctx.translate(centerX + this.translateX, centerY + this.translateY);
      ctx.rotate((this.rotacaoGraus * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, largura, altura);
      ctx.setLineDash([]);

      const handleRotX = centerX;
      const handleRotY = minY - 25;
      ctx.beginPath();
      ctx.moveTo(centerX, minY);
      ctx.lineTo(handleRotX, handleRotY);
      ctx.stroke();

      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(handleRotX, handleRotY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(maxX - 4, maxY - 4, 8, 8);
    }

    ctx.restore();
  }

  fixarFormaNoCanvas() {
    if (this.estado !== 'transformacao') return;
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
      ctx.putImageData(this.snapshotImageData, 0, 0);
    }
    this.estado = 'ocioso';
    this.snapshotImageData = null;
  }
}
