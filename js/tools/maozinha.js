/**
 * PopFlipariz - Área de Mãozinha (Navegação, Pan e Rotação do Ecrã)
 * Caminho: js/tools/maozinha.js
 * Ícone de referência: 🤚 (Mãozinha)
 */

export class HandTool {
  constructor(containerElement, canvasContainer) {
    this.container = containerElement; // Elemento workspace geral
    this.canvasContainer = canvasContainer; // O contentor que envolve o canvas
    
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    this.rotacaoGraus = 0; // Rotação livre ou em passos de 15°
    
    this.espacoPressionado = false;
    this.ativo = false;

    this.inicializarEventos();
  }

  inicializarEventos() {
    // Atalho de teclado: manter a tecla Espaço premida ativa temporariamente a mãozinha no PC[cite: 1]
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.espacoPressionado && document.activeElement.tagName !== 'INPUT') {
        this.espacoPressionado = true;
        this.ativo = true;
        this.canvasContainer.style.cursor = 'grab';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.espacoPressionado = false;
        this.ativo = false;
        this.canvasContainer.style.cursor = 'default';
      }
    });

    // Eventos de arrastar para mover o ecrã (Pan)[cite: 1]
    this.canvasContainer.addEventListener('mousedown', (e) => {
      if (this.ativo || e.button === 1) { // Botão central do rato ou ferramenta ativa
        this.isDragging = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
        this.canvasContainer.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.atualizarTransformacaoVisual();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvasContainer.style.cursor = this.ativo ? 'grab' : 'default';
      }
    });
  }

  atualizarTransformacaoVisual() {
    this.canvasContainer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom}) rotate(${this.rotacaoGraus}deg)`;
  }

  // Encaixar (para ver de longe)[cite: 1]
  encaixarNaTela() {
    this.panX = 0;
    this.panY = 0;
    this.zoom = 0.75; // Afasta para dar vista geral
    this.rotacaoGraus = 0;
    this.atualizarTransformacaoVisual();
  }

  // Restaurar tamanho e posição original[cite: 1]
  restaurarOriginal() {
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    this.rotacaoGraus = 0;
    this.atualizarTransformacaoVisual();
  }

  // Girar o ecrã para a direita ou esquerda (em passos de 15 em 15 ou valor personalizado)[cite: 1]
  girar(graus) {
    this.rotacaoGraus += parseFloat(graus) || 0;
    this.atualizarTransformacaoVisual();
  }

  setRotacaoExata(graus) {
    this.rotacaoGraus = parseFloat(graus) || 0;
    this.atualizarTransformacaoVisual();
  }

  setAtivo(estado) {
    this.ativo = !!estado;
    this.canvasContainer.style.cursor = this.ativo ? 'grab' : 'default';
  }
}
