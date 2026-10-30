/**
 * PopFlipariz - Ferramenta de Seleção Real (Máscara e Recorte)
 * Caminho: js/tools/selecao.js
 */

export class SelectionTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    this.modo = 'quadrado'; // 'quadrado', 'circulo', 'laco', 'linha_reta', 'balde_selecao'
    this.amostragemBalde = 'todas'; // 'todas', 'atual', 'mesma_cor'

    this.desenhando = false;
    this.startX = 0;
    this.startY = 0;
    this.pontos = [];

    // Canvas da Máscara Ativa (Preto/Transparente indicando a área selecionada)
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = 1280;
    this.maskCanvas.height = 720;
    this.maskCtx = this.maskCanvas.getContext('2d');
    this.temSelecaoAtiva = false;

    // Overlay visual para desenhar a linha pontilhada da seleção
    this.overlayCanvas = null;
    this.overlayCtx = null;
  }

  inicializarOverlay(container) {
    if (this.overlayCanvas) return;
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = 1280;
    this.overlayCanvas.height = 720;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '998';
    container.appendChild(this.overlayCanvas);
    this.overlayCtx = this.overlayCanvas.getContext('2d');
  }

  setModo(m) { this.modo = m || 'quadrado'; }
  setAmostragemBalde(a) { this.amostragemBalde = a || 'todas'; }

  iniciar(e) {
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    this.desenhando = true;
    this.startX = x;
    this.startY = y;
    this.pontos = [{ x, y }];
  }

  mover(e) {
    if (!this.desenhando) return;
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (this.modo === 'laco' || this.modo === 'linha_reta') {
      this.pontos.push({ x, y });
    } else {
      this.pontos = [{ x: this.startX, y: this.startY }, { x, y }];
    }

    this.renderizarGuiasPontilhadas();
  }

  soltar() {
    if (!this.desenhando) return;
    this.desenhando = false;
    this.finalizarFormaSelecao();
  }

  finalizarFormaSelecao() {
    if (this.pontos.length < 2 && this.modo !== 'balde_selecao') return;

    this.maskCtx.fillStyle = '#ffffff';
    this.maskCtx.beginPath();

    const p1 = this.pontos[0];
    const p2 = this.pontos[this.pontos.length - 1];

    if (this.modo === 'quadrado') {
      const w = p2.x - p1.x;
      const h = p2.y - p1.y;
      this.maskCtx.rect(p1.x, p1.y, w, h);
    } else if (this.modo === 'circulo') {
      const rx = Math.abs(p2.x - p1.x) / 2;
      const ry = Math.abs(p2.y - p1.y) / 2;
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      this.maskCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    } else if (this.modo === 'laco' || this.modo === 'linha_reta') {
      this.maskCtx.moveTo(this.pontos[0].x, this.pontos[0].y);
      for (let i = 1; i < this.pontos.length; i++) {
        this.maskCtx.lineTo(this.pontos[i].x, this.pontos[i].y);
      }
      this.maskCtx.closePath();
    }

    this.maskCtx.fill();
    this.temSelecaoAtiva = true;
    this.renderizarGuiasPontilhadas();
  }

  selecionarTudo() {
    this.maskCtx.fillStyle = '#ffffff';
    this.maskCtx.fillRect(0, 0, 1280, 720);
    this.temSelecaoAtiva = true;
    this.renderizarGuiasPontilhadas();
  }

  inverterSelecao() {
    const imgData = this.maskCtx.getImageData(0, 0, 1280, 720);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i + 3] = d[i + 3] === 0 ? 255 : 0; // Inverte alfa
    }
    this.maskCtx.putImageData(imgData, 0, 0);
    this.temSelecaoAtiva = true;
    this.renderizarGuiasPontilhadas();
  }

  limparSelecao() {
    this.maskCtx.clearRect(0, 0, 1280, 720);
    this.temSelecaoAtiva = false;
    if (this.overlayCtx) this.overlayCtx.clearRect(0, 0, 1280, 720);
  }

  preencherSelecao() {
    if (!this.temSelecaoAtiva) return;
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    // Usa a máscara de seleção para limitar onde a cor entra
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1280;
    tempCanvas.height = 720;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = this.colorManager.corPrimaria;
    tempCtx.fillRect(0, 0, 1280, 720);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(this.maskCanvas, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    if (this.historyManager) this.historyManager.salvarEstado();
  }

  renderizarGuiasPontilhadas() {
    if (!this.overlayCtx) return;
    this.overlayCtx.clearRect(0, 0, 1280, 720);
    if (!this.temSelecaoAtiva && !this.desenhando) return;

    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = '#00ffff';
    this.overlayCtx.lineWidth = 1.5;
    this.overlayCtx.setLineDash([4, 4]);

    if (this.desenhando && this.pontos.length > 1) {
      const p1 = this.pontos[0];
      const p2 = this.pontos[this.pontos.length - 1];
      if (this.modo === 'quadrado') {
        this.overlayCtx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (this.modo === 'circulo') {
        this.overlayCtx.beginPath();
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;
        this.overlayCtx.ellipse((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, rx, ry, 0, 0, Math.PI * 2);
        this.overlayCtx.stroke();
      } else if (this.modo === 'laco' || this.modo === 'linha_reta') {
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(this.pontos[0].x, this.pontos[0].y);
        for (let i = 1; i < this.pontos.length; i++) {
          this.overlayCtx.lineTo(this.pontos[i].x, this.pontos[i].y);
        }
        this.overlayCtx.stroke();
      }
    }
    this.overlayCtx.restore();
  }
}
