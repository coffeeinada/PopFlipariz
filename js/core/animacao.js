/**
 * PopFlipariz - Área de Animação FBF e Timeline
 * Caminho: js/core/animacao.js
 * Ícone de referência: 🎬 (Claquete)
 */

export class AnimationManager {
  constructor(layerManager, historyManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;

    this.frames = []; // Cada frame armazena o estado de todas as camadas
    this.indiceFrameAtual = 0;
    
    // Configurações de Reprodução e Animação
    this.fps = 12; // Mínimo 1
    this.reproduzindo = false;
    this.loopAtivo = true;
    this.frameInicial = 0;
    this.frameFinal = 0;
    this.intervaloPlay = null;

    this.audioTrack = {
      url: null,
      audioElement: null,
      frameInicio: 0
    };

    // Casca de Cebola (até 3 do passado e do futuro, com cores e opacidades customizáveis)
    this.cascaCebolaConfig = {
      ativa: false,
      passadosQtd: 2,
      futurosQtd: 1,
      opacidadeBase: 0.35,
      corPassado: '#ff69b4', // Cor fantasma para frames anteriores
      corFuturo: '#87ceeb'   // Cor fantasma para frames seguintes
    };

    // Toda obra nova nasce obrigatoriamente com 1 frame padrão (nunca 0)[cite: 2]
    this.inicializarPrimeiroFrame();
  }

  inicializarPrimeiroFrame() {
    const estadoInicialCamadas = this.layerManager.camadas.map(c => this.capturarEstadoCamada(c));
    this.frames.push({ id: 'frame_' + Date.now(), camadas: estadoInicialCamadas });
    this.frameFinal = 0;
  }

  capturarEstadoCamada(camada) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.layerManager.width;
    tempCanvas.height = this.layerManager.height;
    tempCanvas.getContext('2d').drawImage(camada.canvas, 0, 0);
    return {
      nome: camada.nome,
      visivel: camada.visivel,
      opacidade: camada.opacidade,
      blendMode: camada.blendMode,
      imagemDataUrl: tempCanvas.toDataURL('image/png')
    };
  }

  // Sincroniza o canvas atual com o frame ativo na timeline
  carregarFrameNoWorkspace(indice) {
    if (indice < 0 || indice >= this.frames.length) return;
    this.indiceFrameAtual = indice;
    const frame = this.frames[indice];

    // Garante que o LayerManager tem as camadas correspondentes ao frame
    frame.camadas.forEach((dadosCamada, idx) => {
      if (!this.layerManager.camadas[idx]) {
        this.layerManager.adicionarCamada(dadosCamada.nome);
      }
      const camadaAtual = this.layerManager.camadas[idx];
      camadaAtual.nome = dadosCamada.nome;
      camadaAtual.visivel = dadosCamada.visivel;
      camadaAtual.opacidade = dadosCamada.opacidade;
      camadaAtual.blendMode = dadosCamada.blendMode;

      const img = new Image();
      img.onload = () => {
        camadaAtual.ctx.clearRect(0, 0, this.layerManager.width, this.layerManager.height);
        camadaAtual.ctx.drawImage(img, 0, 0);
        this.layerManager.atualizarZIndex();
      };
      img.src = dadosCamada.imagemDataUrl;
    });
  }

  // Regras rigorosas de propagação de alterações entre frames descritas no documento[cite: 2]
  salvarEstadoAtualNoFrame() {
    if (!this.frames[this.indiceFrameAtual]) return;
    this.frames[this.indiceFrameAtual].camadas = this.layerManager.camadas.map(c => this.capturarEstadoCamada(c));
  }

  // Novo frame à direita do frame atual[cite: 2]
  adicionarNovoFrameDireita() {
    this.salvarEstadoAtualNoFrame();
    const estadoAtual = this.layerManager.camadas.map(c => this.capturarEstadoCamada(c));
    const novoFrame = { id: 'frame_' + Date.now(), camadas: estadoAtual };

    this.frames.splice(this.indiceFrameAtual + 1, 0, novoFrame);
    this.indiceFrameAtual++;
    this.frameFinal = this.frames.length - 1;
    this.carregarFrameNoWorkspace(this.indiceFrameAtual);
  }

  // Novo frame à esquerda do frame atual[cite: 2]
  adicionarNovoFrameEsquerda() {
    this.salvarEstadoAtualNoFrame();
    const estadoAtual = this.layerManager.camadas.map(c => this.capturarEstadoCamada(c));
    const novoFrame = { id: 'frame_' + Date.now(), camadas: estadoAtual };

    this.frames.splice(this.indiceFrameAtual, 0, novoFrame);
    this.frameFinal = this.frames.length - 1;
    this.carregarFrameNoWorkspace(this.indiceFrameAtual);
  }

  duplicarFrameAtual() {
    this.salvarEstadoAtualNoFrame();
    const alvo = this.frames[this.indiceFrameAtual];
    const copiaCamadas = alvo.camadas.map(c => ({ ...c }));
    const novoFrame = { id: 'frame_' + Date.now(), camadas: copiaCamadas };

    this.frames.splice(this.indiceFrameAtual + 1, 0, novoFrame);
    this.indiceFrameAtual++;
    this.frameFinal = this.frames.length - 1;
    this.carregarFrameNoWorkspace(this.indiceFrameAtual);
  }

  excluirFrameAtual() {
    if (this.frames.length <= 1) {
      alert('A animação precisa de ter pelo menos 1 frame!');
      return;
    }
    this.frames.splice(this.indiceFrameAtual, 1);
    if (this.indiceFrameAtual >= this.frames.length) {
      this.indiceFrameAtual = this.frames.length - 1;
    }
    this.frameFinal = this.frames.length - 1;
    this.carregarFrameNoWorkspace(this.indiceFrameAtual);
  }

  limparCamadaAtualFrame() {
    this.layerManager.limparCamada();
    this.salvarEstadoAtualNoFrame();
  }

  limparFrameInteiro() {
    this.layerManager.camadas.forEach((_, idx) => this.layerManager.limparCamada(idx));
    this.salvarEstadoAtualNoFrame();
  }

  // Controlo de Reprodução (Play, Pause, Loop, FPS)[cite: 2]
  play(ctxVisualizacao) {
    if (this.reproduzindo) return;
    this.reproduzindo = true;
    let frameLead = this.frameInicial;

    const intervaloMs = 1000 / Math.max(1, this.fps);
    this.intervaloPlay = setInterval(() => {
      this.carregarFrameNoWorkspace(frameLead);
      frameLead++;
      if (frameLead > this.frameFinal) {
        if (this.loopAtivo) {
          frameLead = this.frameInicial;
        } else {
          this.pause();
        }
      }
    }, intervaloMs);
  }

  pause() {
    this.reproduzindo = false;
    if (this.intervaloPlay) {
      clearInterval(this.intervaloPlay);
      this.intervaloPlay = null;
    }
  }

  // Adicionar faixa de áudio arrastável[cite: 2]
  adicionarFaixaAudio(urlAudio, frameInicio = 0) {
    this.audioTrack.url = urlAudio;
    this.audioTrack.audioElement = new Audio(urlAudio);
    this.audioTrack.frameInicio = parseInt(frameInicio) || 0;
  }

  configurarCascaCebola(config) {
    this.cascaCebolaConfig = { ...this.cascaCebolaConfig, ...config };
  }
}
