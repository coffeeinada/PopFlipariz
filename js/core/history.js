/**
 * PopFlipariz - Gestor de Histórico (Desfazer e Refazer Seguro)
 * Caminho: js/core/history.js
 */

export class HistoryManager {
  constructor(layerManager = null) {
    this.layerManager = layerManager;
    this.undoStack = [];
    this.redoStack = [];
    this.maxStops = 30;
  }

  // Permite vincular o LayerManager caso tenha sido instanciado depois
  definirLayerManager(layerManager) {
    this.layerManager = layerManager;
  }

  salvarEstado() {
    if (!this.layerManager || typeof this.layerManager.obterCanvasAtivo !== 'function') return;
    
    const canvas = this.layerManager.obterCanvasAtivo();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.undoStack.push(imageData);
      if (this.undoStack.length > this.maxStops) {
        this.undoStack.shift();
      }
      this.redoStack = []; // Limpa a pilha de refazer em novas ações
    } catch (e) {
      console.warn('Não foi possível salvar o estado do histórico:', e);
    }
  }

  undo() {
    if (this.undoStack.length <= 1 || !this.layerManager) return false;
    const estadoAtual = this.undoStack.pop();
    this.redoStack.push(estadoAtual);

    const estadoAnterior = this.undoStack[this.undoStack.length - 1];
    const canvas = this.layerManager.obterCanvasAtivo();
    const ctx = canvas.getContext('2d');
    if (ctx && estadoAnterior) {
      ctx.putImageData(estadoAnterior, 0, 0);
      return true;
    }
    return false;
  }

  redo() {
    if (this.redoStack.length === 0 || !this.layerManager) return false;
    const proximoEstado = this.redoStack.pop();
    this.undoStack.push(proximoEstado);

    const canvas = this.layerManager.obterCanvasAtivo();
    const ctx = canvas.getContext('2d');
    if (ctx && proximoEstado) {
      ctx.putImageData(proximoEstado, 0, 0);
      return true;
    }
    return false;
  }
}
