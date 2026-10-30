/**
 * PopFlipariz - Motor de Pincel e Borracha Robusto
 * Caminho: js/tools/pincel.js
 */

export class PincelTool {
  constructor(canvas, historyManager, colorManager) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    this.desenhando = false;
    this.modoBorracha = false;
    this.tamanho = 8;
    this.ultimoX = 0;
    this.ultimoY = 0;

    this.inicializarEventos();
  }

  atualizarCanvas(novoCanvas) {
    if (!novoCanvas) return;
    this.canvas = novoCanvas;
    this.ctx = novoCanvas.getContext('2d');
    this.inicializarEventos();
  }

  setModoBorracha(ativo) {
    this.modoBorracha = ativo;
  }

  setTamanho(t) {
    this.tamanho = t;
  }

  inicializarEventos() {
    if (!this.canvas) return;

    this.canvas.onmousedown = null;
    this.canvas.onmousemove = null;
    this.canvas.onmouseup = null;
    this.canvas.onmouseleave = null;

    this.canvas.onmousedown = (e) => this.comecarDesenho(e);
    this.canvas.onmousemove = (e) => this.desenhar(e);
    this.canvas.onmouseup = () => this.pararDesenho();
    this.canvas.onmouseleave = () => this.pararDesenho();

    this.canvas.ontouchstart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.comecarDesenho(touch);
    };
    this.canvas.ontouchmove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.desenhar(touch);
    };
    this.canvas.ontouchend = () => this.pararDesenho();
  }

  obterCoordenadas(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  comecarDesenho(e) {
    this.desenhando = true;
    const pos = this.obterCoordenadas(e);
    this.ultimoX = pos.x;
    this.ultimoY = pos.y;
  }

  desenhar(e) {
    if (!this.desenhando || !this.ctx) return;
    const pos = this.obterCoordenadas(e);

    this.ctx.save();
    this.ctx.lineWidth = this.tamanho;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.modoBorracha) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.colorManager ? this.colorManager.corPrimaria : '#ff69b4';
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this.ultimoX, this.ultimoY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.restore();

    this.ultimoX = pos.x;
    this.ultimoY = pos.y;
  }

  pararDesenho() {
    if (this.desenhando) {
      this.desenhando = false;
      if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
        this.historyManager.salvarEstado();
      }
    }
  }
}

export function inicializarPincel(canvas, historyManager, colorManager) {
  return new PincelTool(canvas, historyManager, colorManager);
}
