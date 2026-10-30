/**
 * PopFlipariz - Área de Seleção e Transformação
 * Caminho: js/tools/selecao.js
 * Ícone de referência: 🤠 (Laço de cowboy)
 */

export class SelectionTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    // Configurações e estado da seleção
    this.formaSelecao = 'laco'; // 'quadrado', 'circulo', 'laco', 'caminho_retas', 'balde'
    this.pontosSelecao = [];
    this.isSelecionando = false;
    this.temSelecaoAtiva = false;
    this.transfTransformando = false;
  }

  iniciar(x, y) {
    this.isSelecionando = true;
    this.pontosSelecao = [{ x, y }];
  }

  atualizar(x, y) {
    if (!this.isSelecionando) return;
    this.pontosSelecao.push({ x, y });
  }

  concluir() {
    if (!this.isSelecionando) return;
    this.isSelecionando = false;
    this.temSelecaoAtiva = this.pontosSelecao.length > 2;
  }

  // Selecionar tudo no canvas ativo
  selecionarTudo() {
    const canvas = this.layerManager.obterCanvasAtivo();
    this.pontosSelecao = [
      { x: 0, y: 0 },
      { x: canvas.width, y: 0 },
      { x: canvas.width, y: canvas.height },
      { x: 0, y: canvas.height }
    ];
    this.temSelecaoAtiva = true;
  }

  // Inverter seleção
  inverterSelecao() {
    if (!this.temSelecaoAtiva) {
      this.selecionarTudo();
    } else {
      // Lógica para inverter a máscara de seleção ativa
    }
  }

  // Limpar seleção atual
  limparSelecao() {
    this.pontosSelecao = [];
    this.temSelecaoAtiva = false;
  }

  // Preencher a área selecionada com a cor primária atual
  preencherSelecao() {
    if (!this.temSelecaoAtiva) return;

    const ctx = this.layerManager.obterCtxAtivo();
    ctx.save();
    ctx.fillStyle = this.colorManager ? this.colorManager.corPrimaria : '#ff69b4';
    
    // Desenha o preenchimento com base nos pontos da seleção atual
    ctx.beginPath();
    if (this.pontosSelecao.length > 0) {
      ctx.moveTo(this.pontosSelecao[0].x, this.pontosSelecao[0].y);
      for (let i = 1; i < this.pontosSelecao.length; i++) {
        ctx.lineTo(this.pontosSelecao[i].x, this.pontosSelecao[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    if (this.historyManager) {
      this.historyManager.salvarEstado();
    }
  }

  // Ferramentas de Transformação (cortar, expandir, redimensionar, girar, perspetiva)
  aplicarTransformacao(tipo, valorParametro) {
    if (!this.temSelecaoAtiva) return;

    const ctx = this.layerManager.obterCtxAtivo();
    const canvas = this.layerManager.obterCanvasAtivo();

    ctx.save();
    switch (tipo) {
      case 'cortar':
        // Corta a área fora da seleção
        break;
      case 'expandir':
        // Expande a seleção com base no valor fornecido
        break;
      case 'redimensionar':
        // Redimensiona o conteúdo selecionado
        break;
      case 'girar':
        // Rotação do conteúdo selecionado (ângulo em graus)
        const anguloRad = (valorParametro * Math.PI) / 180;
        break;
      case 'perspetiva':
        // Aplicação de matriz de transformação de perspetiva
        break;
      default:
        break;
    }
    ctx.restore();

    if (this.historyManager) {
      this.historyManager.salvarEstado();
    }
  }

  setFormaSelecao(forma) {
    this.formaSelecao = forma;
  }
}
