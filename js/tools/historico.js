/**
 * PopFlipariz - Área de Desfazer e Refazer
 * Caminho: js/tools/historico.js
 * Ícones de referência: ↩️ (Seta voltando para trás) e ↪️ (Seta voltando para a frente)
 */

export class HistoryTool {
  constructor(historyManager) {
    this.historyManager = historyManager;
    this.inicializarAtalhos();
  }

  // Executa a ação de Desfazer (Undo)
  desfazer() {
    if (this.historyManager) {
      return this.historyManager.undo();
    }
    return false;
  }

  // Executa a ação de Refazer (Redo)
  refazer() {
    if (this.historyManager) {
      return this.historyManager.redo();
    }
    return false;
  }

  // Inicializa a escuta dos atalhos globais de teclado (Ctrl+Z e Ctrl+Y)
  inicializarAtalhos() {
    window.addEventListener('keydown', (e) => {
      // Evita acionar os atalhos se o utilizador estiver a digitar num campo de texto ou caixa de entrada
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.ctrlKey || e.metaKey) {
        // Atalho Ctrl + Z (Desfazer) ou Ctrl + Shift + Z (Refazer)
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            this.refazer();
          } else {
            this.desfazer();
          }
        } 
        // Atalho Ctrl + Y (Refazer)
        else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          this.refazer();
        }
      }
    });
  }
}
