/**
 * PopFlipariz - Gestor Avançado de Camadas e Pastas
 * Caminho: js/core/layer-manager.js
 */

export class LayerManager {
  constructor(canvasContainer, largura = 1280, altura = 720, historyManager = null) {
    this.container = canvasContainer;
    this.largura = largura;
    this.altura = altura;
    this.historyManager = historyManager;

    this.camadas = [];
    this.indiceCamadaAtiva = 0;
    this.clipboardBuffer = null;

    // Força a criação imediata da primeira camada ao instanciar
    this.redefinirProjeto();
  }

  redefinirProjeto() {
    this.camadas = [];
    this.indiceCamadaAtiva = 0;
    this.adicionarCamada('Camada 1');
  }

  criarCanvasElemento() {
    const canvas = document.createElement('canvas');
    canvas.width = this.largura;
    canvas.height = this.altura;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'auto';
    return canvas;
  }

  adicionarCamada(nomePersonalizado = null) {
    if (!this.container) return;

    const id = 'layer_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const nome = nomePersonalizado || `Camada ${this.camadas.length + 1}`;
    const canvas = this.criarCanvasElemento();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Limpa o canvas para garantir que não nasce preto ou com lixo de memória
    ctx.clearRect(0, 0, this.largura, this.altura);

    const novaCamada = {
      id,
      nome,
      tipo: 'camada',
      canvas,
      ctx,
      visivel: true,
      alphaLocked: false,
      blendMode: 'source-over',
      opacidade: 1.0
    };

    this.camadas.push(novaCamada);
    this.indiceCamadaAtiva = this.camadas.length - 1;
    this.reorganizarDOMCanvas();
    this.atualizarUIlistaCamadas();

    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  adicionarPasta() {
    const id = 'folder_' + Date.now();
    const novaPasta = {
      id,
      nome: `Pasta ${this.camadas.length + 1}`,
      tipo: 'pasta',
      aberta: true,
      visivel: true
    };
    this.camadas.push(novaPasta);
    this.indiceCamadaAtiva = this.camadas.length - 1;
    this.atualizarUIlistaCamadas();
  }

  removerCamada() {
    if (this.camadas.length <= 1) {
      alert('O projeto precisa de ter pelo menos uma camada!');
      return;
    }
    const removida = this.camadas.splice(this.indiceCamadaAtiva, 1)[0];
    if (removida && removida.tipo === 'camada' && removida.canvas) {
      removida.canvas.remove();
    }
    this.indiceCamadaAtiva = Math.max(0, this.indiceCamadaAtiva - 1);
    this.reorganizarDOMCanvas();
    this.atualizarUIlistaCamadas();

    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  duplicarCamada() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (!atual || atual.tipo !== 'camada') return;

    const id = 'layer_' + Date.now();
    const canvas = this.criarCanvasElemento();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(atual.canvas, 0, 0);

    const duplicada = {
      id,
      nome: `${atual.nome} (Cópia)`,
      tipo: 'camada',
      canvas,
      ctx,
      visivel: atual.visivel,
      alphaLocked: atual.alphaLocked,
      blendMode: atual.blendMode,
      opacidade: atual.opacidade
    };

    this.camadas.splice(this.indiceCamadaAtiva + 1, 0, duplicada);
    this.indiceCamadaAtiva++;
    this.reorganizarDOMCanvas();
    this.atualizarUIlistaCamadas();

    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  limparCamadaAtual() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (!atual || atual.tipo !== 'camada') return;
    atual.ctx.clearRect(0, 0, this.largura, this.altura);
    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }

  espelharHorizontal() {
    const
