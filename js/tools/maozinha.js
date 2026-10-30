/**
 * PopFlipariz - Ferramenta de Movimentação (Pan) e Rotação da Tela
 * Caminho: js/tools/maozinha.js
 */

export class HandTool {
  constructor(viewport, canvasContainer) {
    this.viewport = viewport;
    this.canvasContainer = canvasContainer;
    this.ativo = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    this.rotacao = 0;

    this.initEvents();
  }

  setAtivo(ativo) {
    this.ativo = !!ativo;
    if (this.viewport) {
      this.viewport.style.cursor = this.ativo ? 'grab' : 'default';
    }
  }

  setZoom(z) {
    this.zoom = z;
    this.aplicarTransformacao();
  }

  girar(angulo) {
    this.rotacao = (this.rotacao + angulo) % 360;
    this.aplicarTransformacao();
  }

  resetarRotacao() {
    this.rotacao = 0;
    this.aplicarTransformacao();
  }

  aplicarTransformacao() {
    if (!this.canvasContainer) return;
    this.canvasContainer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom}) rotate(${this.rotacao}deg)`;
  }

  initEvents() {
    if (!this.viewport) return;

    this.viewport.addEventListener('mousedown', (e) => {
      if (!this.ativo) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.viewport.style.cursor = 'grabbing';
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.ativo || !this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.aplicarTransformacao();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.ativo && this.viewport) {
          this.viewport.style.cursor = 'grab';
        }
      }
    });
  }
}
