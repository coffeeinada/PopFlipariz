/**
 * PopFlipariz - Área de Zoom (Lupa e Atalhos I / O)
 * Caminho: js/tools/zoom.js
 * Ícones de referência: 🔍+ e 🔍- (Lupa com mais e menos)
 */

export class ZoomTool {
  constructor(canvasContainer) {
    this.canvasContainer = canvasContainer;
    this.zoomAtual = 1.0;
    this.minZoom = 0.1;
    this.maxZoom = 20.0;
    this.passoZoom = 0.15;

    this.inicializarAtalhos();
  }

  aplicarZoom(novoZoom) {
    this.zoomAtual = Math.max(this.minZoom, Math.min(this.maxZoom, novoZoom));
    this.canvasContainer.style.transform = `scale(${this.zoomAtual})`;
  }

  zoomIn() {
    this.aplicarZoom(this.zoomAtual + this.passoZoom);
  }

  zoomOut() {
    this.aplicarZoom(this.zoomAtual - this.passoZoom);
  }

  resetZoom() {
    this.zoomAtual = 1.0;
    this.aplicarZoom(this.zoomAtual);
  }

  inicializarAtalhos() {
    window.addEventListener('keydown', (e) => {
      // Evita disparar se o utilizador estiver a escrever num campo de texto
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Tecla 'I' para Zoom In (Aproximar) conforme os requisitos
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        this.zoomIn();
      } 
      // Tecla 'O' para Zoom Out (Afastar) conforme os requisitos
      else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        this.zoomOut();
      }
    });
  }
}
