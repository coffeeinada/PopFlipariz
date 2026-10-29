/**
 * PopFlipariz - Gerenciador de Histórico (Undo / Redo)
 * Caminho: js/core/history.js
 */

export class HistoryManager {
  constructor(canvas, ctx, maxSteps = 20) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.maxSteps = maxSteps;
    this.undoStack = [];
    this.redoStack = [];
    
    // Salva o estado inicial em branco
    this.salvarEstado();
  }

  salvarEstado() {
    // Se a pilha exceder o limite, remove o estado mais antigo
    if (this.undoStack.length >= this.maxSteps) {
      this.undoStack.shift();
    }
    
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(imageData);
    
    // Sempre que um novo traço é feito, limpa a pilha de refazer (redo)
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length <= 1) return false; // Mantém pelo menos o estado inicial vazio
    
    // Move o estado atual para o redo
    const estadoAtual = this.undoStack.pop();
    this.redoStack.push(estadoAtual);
    
    // Restaura o estado anterior
    const estadoAnterior = this.undoStack[this.undoStack.length - 1];
    this.ctx.putImageData(estadoAnterior, 0, 0);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    
    // Pega o estado do redo e joga de volta no undo
    const proximoEstado = this.redoStack.pop();
    this.undoStack.push(proximoEstado);
    
    this.ctx.putImageData(proximoEstado, 0, 0);
    return true;
  }
}
