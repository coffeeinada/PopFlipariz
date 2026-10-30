/**
 * PopFlipariz - Área de Camadas Completa (Gestão, Modos de Mesclagem, Pastas e Ponto de Fuga)
 * Caminho: js/core/layer-manager.js
 * Ícone de referência: 🗂️ (Dois quadrados sobrepostos)
 */

export class LayerManager {
  constructor(containerElement, largura, altura, historyManager) {
    this.container = containerElement;
    this.width = largura;
    this.height = altura;
    this.historyManager = historyManager;
    
    this.camadas = [];
    this.indiceAtivo = 0;
    this.copiaBuffer = null; // Para funcionalidade de Copiar/Colar Camada (Ctrl+C / Ctrl+V)
    
    this. GrelhaAtiva = false;
    this.pontoFugaConfig = {
      ativo: false,
      x: largura / 2,
      y: altura / 2,
      cor: '#ff69b4',
      larguraLinha: 1,
      quantidadeLinhas: 12
    };

    // Cria a primeira camada padrão ao iniciar
    this.adicionarCamada('Camada 1');
  }

  criarCanvasVazio() {
    const c = document.createElement('canvas');
    c.width = this.width;
    c.height = this.height;
    c.style.position = 'absolute';
    c.style.top = '0';
    c.style.left = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.pointerEvents = 'none';
    return c;
  }

  // Criar nova camada
  adicionarCamada(nome = `Camada ${this.camadas.length + 1}`, pastaId = null) {
    const canvas = this.criarCanvasVazio();
    this.container.appendChild(canvas);

    const novaCamada = {
      id: 'layer_' + Date.now() + Math.random(),
      nome: nome,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      visivel: true,
      bloqueadaAlpha: false,
      opacidade: 1.0,
      blendMode: 'normal', // normal, multiply, screen, overlay, darken, lighten, etc.
      pastaId: pastaId
    };

    this.camadas.push(novaCamada);
    this.indiceAtivo = this.camadas.length - 1;
    this.atualizarZIndex();
    return novaCamada;
  }

  // Agrupar em pasta 🗂️
  criarPasta(nomePasta = 'Pasta de Camadas') {
    return {
      id: 'folder_' + Date.now(),
      nome: nomePasta,
      aberta: true
    };
  }

  // Excluir camada (atalho Ctrl+X nos requisitos)
  removerCamada(indice = this.indiceAtivo) {
    if (this.camadas.length <= 1) {
      alert('O projeto precisa de manter pelo menos uma camada!');
      return;
    }

    this.container.removeChild(this.camadas[indice].canvas);
    this.camadas.splice(indice, 1);

    if (this.indiceAtivo >= this.camadas.length) {
      this.indiceAtivo = this.camadas.length - 1;
    }
    this.atualizarZIndex();
  }

  // Duplicar camada
  duplicarCamada(indice = this.indiceAtivo) {
    const alvo = this.camadas[indice];
    const novoCanvas = this.criarCanvasVazio();
    const novoCtx = novoCanvas.getContext('2d');
    novoCtx.drawImage(alvo.canvas, 0, 0);

    this.container.appendChild(novoCanvas);

    const duplicada = {
      id: 'layer_' + Date.now(),
      nome: alvo.nome + ' (Cópia)',
      canvas: novoCanvas,
      ctx: novoCtx,
      visivel: alvo.visivel,
      bloqueadaAlpha: alvo.bloqueadaAlpha,
      opacidade: alvo.opacidade,
      blendMode: alvo.blendMode,
      pastaId: alvo.pastaId
    };

    this.camadas.splice(indice + 1, 0, duplicada);
    this.indiceAtivo = indice + 1;
    this.atualizarZIndex();
  }

  // Copiar camada (Ctrl+C) e Colar camada (Ctrl+V)
  copiarCamadaAtiva() {
    const alvo = this.camadas[this.indiceAtivo];
    const bufferCanvas = this.criarCanvasVazio();
    bufferCanvas.getContext('2d').drawImage(alvo.canvas, 0, 0);
    this.copiaBuffer = bufferCanvas;
  }

  colarCamada() {
    if (!this.copiaBuffer) return;
    const novoCanvas = this.criarCanvasVazio();
    novoCanvas.getContext('2d').drawImage(this.copiaBuffer, 0, 0);
    this.container.appendChild(novoCanvas);

    const colada = {
      id: 'layer_' + Date.now(),
      nome: 'Camada Colada',
      canvas: novoCanvas,
      ctx: novoCanvas.getContext('2d'),
      visivel: true,
      bloqueadaAlpha: false,
      opacidade: 1.0,
      blendMode: 'normal',
      pastaId: null
    };

    this.camadas.push(colada);
    this.indiceAtivo = this.camadas.length - 1;
    this.atualizarZIndex();
  }

  // Fundir camada atual com a de baixo (Ctrl+E)
  fundirComBaixo(indice = this.indiceAtivo) {
    if (indice <= 0 || indice >= this.camadas.length) return;

    const camadaBaixo = this.camadas[indice - 1];
    const camadaAtual = this.camadas[indice];

    camadaBaixo.ctx.save();
    camadaBaixo.ctx.globalAlpha = camadaAtual.opacidade;
    camadaBaixo.ctx.globalCompositeOperation = camadaAtual.blendMode;
    camadaBaixo.ctx.drawImage(camadaAtual.canvas, 0, 0);
    camadaBaixo.ctx.restore();

    this.removerCamada(indice);
  }

  // Limpar camada
  limparCamada(indice = this.indiceAtivo) {
    const camada = this.camadas[indice];
    camada.ctx.clearRect(0, 0, this.width, this.height);
    if (this.historyManager) this.historyManager.salvarEstado();
  }

  // Renomear camada
  renomearCamada(indice, novoNome) {
    if (this.camadas[indice]) {
      this.camadas[indice].nome = novoNome;
    }
  }

  // Ocultar / Mostrar camada
  alternarVisibilidade(indice = this.indiceAtivo) {
    this.camadas[indice].visivel = !this.camadas[indice].visivel;
    this.atualizarZIndex();
  }

  // Bloquear Alpha
  alternarBloqueioAlpha(indice = this.indiceAtivo) {
    this.camadas[indice].bloqueadaAlpha = !this.camadas[indice].bloqueadaAlpha;
  }

  // Espelhar de lado (Horizontal) e de ponta cabeça (Vertical)
  espelharHorizontal(indice = this.indiceAtivo) {
    const camada = this.camadas[indice];
    const temp = this.criarCanvasVazio();
    const tCtx = temp.getContext('2d');
    tCtx.scale(-1, 1);
    tCtx.drawImage(camada.canvas, -this.width, 0);
    
    camada.ctx.clearRect(0, 0, this.width, this.height);
    camada.ctx.drawImage(temp, 0, 0);
    if (this.historyManager) this.historyManager.salvarEstado();
  }

  espelharVertical(indice = this.indiceAtivo) {
    const camada = this.camadas[indice];
    const temp = this.criarCanvasVazio();
    const tCtx = temp.getContext('2d');
    tCtx.scale(1, -1);
    tCtx.drawImage(camada.canvas, 0, -this.height);

    camada.ctx.clearRect(0, 0, this.width, this.height);
    camada.ctx.drawImage(temp, 0, 0);
    if (this.historyManager) this.historyManager.salvarEstado();
  }

  // Opções de mesclagem (Blend Modes)
  setBlendMode(indice, modo) {
    this.camadas[indice].blendMode = modo;
    this.camadas[indice].canvas.style.mixBlendMode = modo;
  }

  setOpacidadeCamada(indice, valor) {
    this.camadas[indice].opacidade = parseFloat(valor);
    this.atualizarZIndex();
  }

  // Organizar ordem visual (Z-Index e visibilidade)
  atualizarZIndex() {
    this.camadas.forEach((camada, idx) => {
      camada.canvas.style.zIndex = idx + 1;
      camada.canvas.style.opacity = camada.visivel ? camada.opacidade : 0;
      camada.canvas.style.display = camada.visivel ? 'block' : 'none';
    });
  }

  // Grade (Grid) e Ponto de Fuga configurável
  toggleGrelha(ativo) {
    this.GrelhaAtiva = !!ativo;
  }

  configurarPontoFuga(config) {
    this.pontoFugaConfig = { ...this.pontoFugaConfig, ...config };
  }

  obterCanvasAtivo() {
    return this.camadas[this.indiceAtivo].canvas;
  }

  obterCtxAtivo() {
    return this.camadas[this.indiceAtivo].ctx;
  }
}
