/**
 * PopFlipariz - Motor de Pincel e Borracha Avançado
 * Caminho: js/tools/pincel.js
 */

export class PincelTool {
  constructor(canvas, historyManager, colorManager) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    this.desenhando = false;
    this.modoBorracha = false;
    
    // Propriedades do Pincel
    this.tamanho = 8.0;
    this.opacidade = 1.0;
    this.estabilizador = 0;
    this.tipo = 'normal'; // 'normal', 'pixel', 'spray', 'borradinho', 'aquarela', 'bico_de_pena', 'laco'

    // Propriedades da Borracha
    this.eraserSize = 20.0;
    this.eraserOpacity = 1.0;
    this.eraserShape = 'round'; // 'round' ou 'square'
    this.eraserType = 'normal'; // 'normal' ou 'soft'

    // Controlo interno
    this.historicoPontos = [];
    this.pontosLaco = [];
    this.ultimoX = 0;
    this.ultimoY = 0;
    this.ultimoTempo = 0;

    this.inicializarEventos();
  }

  atualizarCanvas(novoCanvas) {
    if (!novoCanvas) return;
    this.canvas = novoCanvas;
    this.ctx = novoCanvas.getContext('2d', { willReadFrequently: true });
    this.inicializarEventos();
  }

  setModoBorracha(ativo) {
    this.modoBorracha = ativo;
  }

  setTamanho(t) {
    this.tamanho = Math.max(0.1, Math.min(200.0, parseFloat(t) || 1.0));
  }

  setOpacidade(o) {
    this.opacidade = Math.max(0.01, Math.min(1.0, parseFloat(o) || 1.0));
  }

  setEstabilizador(e) {
    this.estabilizador = Math.max(0, Math.min(10, parseInt(e) || 0));
  }

  setTipo(tipo) {
    this.tipo = tipo || 'normal';
  }

  setEraserSize(s) {
    this.eraserSize = Math.max(0, Math.min(400.0, parseFloat(s) || 20.0));
  }

  setEraserOpacity(o) {
    this.eraserOpacity = Math.max(0.01, Math.min(1.0, parseFloat(o) || 1.0));
  }

  setEraserShape(shape) {
    this.eraserShape = shape || 'round';
  }

  setEraserType(type) {
    this.eraserType = type || 'normal';
  }

  inicializarEventos() {
    if (!this.canvas) return;

    this.canvas.onmousedown = null;
    this.canvas.onmousemove = null;
    this.canvas.onmouseup = null;
    this.canvas.onmouseleave = null;

    this.canvas.onmousedown = (e) => this.comecarDesenho(e);
    this.canvas.onmousemove = (e) => this.desenhar(e);
    this.canvas.onmouseup = () => this.pararDesenho();
    this.canvas.onmouseleave = () => this.pararDesenho();

    this.canvas.ontouchstart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.comecarDesenho(touch);
    };
    this.canvas.ontouchmove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.desenhar(touch);
    };
    this.canvas.ontouchend = () => this.pararDesenho();
  }

  obterCoordenadas(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
      tempo: Date.now()
    };
  }

  comecarDesenho(e) {
    this.desenhando = true;
    const pos = this.obterCoordenadas(e);
    this.ultimoX = pos.x;
    this.ultimoY = pos.y;
    this.ultimoTempo = pos.tempo;
    this.historicoPontos = [pos];

    if (this.tipo === 'laco' && !this.modoBorracha) {
      this.pontosLaco = [pos];
    }
  }

  desenhar(e) {
    if (!this.desenhando || !this.ctx) return;
    const posRaw = this.obterCoordenadas(e);

    // Se estiver no modo Laço, acumula pontos e desenha um contorno guia leve
    if (this.tipo === 'laco' && !this.modoBorracha) {
      this.pontosLaco.push(posRaw);
      return;
    }

    // Aplicação do Estabilizador (0 a 10)
    let pos = posRaw;
    if (this.estabilizador > 0 && !this.modoBorracha) {
      this.historicoPontos.push(posRaw);
      const maxPontos = this.estabilizador * 2 + 1;
      if (this.historicoPontos.length > maxPontos) {
        this.historicoPontos.shift();
      }
      let somaX = 0;
      let somaY = 0;
      this.historicoPontos.forEach(p => {
        somaX += p.x;
        somaY += p.y;
      });
      pos = {
        x: somaX / this.historicoPontos.length,
        y: somaY / this.historicoPontos.length,
        tempo: posRaw.tempo
      };
    }

    this.ctx.save();

    if (this.modoBorracha) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.globalAlpha = this.eraserOpacity;
      this.ctx.lineWidth = Math.max(0, this.eraserSize);

      if (this.eraserShape === 'square') {
        this.ctx.lineCap = 'square';
        this.ctx.lineJoin = 'miter';
      } else {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
      }

      if (this.eraserType === 'soft') {
        this.ctx.shadowBlur = this.eraserSize * 0.4;
        this.ctx.shadowColor = 'rgba(0,0,0,1)';
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      this.ctx.fillStyle = 'rgba(0,0,0,1)';

      this.ctx.beginPath();
      this.ctx.moveTo(this.ultimoX, this.ultimoY);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();

    } else {
      this.ctx.globalAlpha = this.opacidade;
      this.ctx.globalCompositeOperation = 'source-over';
      const cor = this.colorManager ? this.colorManager.corPrimaria : '#ff69b4';
      this.ctx.strokeStyle = cor;
      this.ctx.fillStyle = cor;

      switch (this.tipo) {
        case 'pixel':
          this.ctx.imageSmoothingEnabled = false;
          this.ctx.lineWidth = Math.max(1, Math.round(this.tamanho));
          this.ctx.lineCap = 'square';
          this.ctx.lineJoin = 'bevel';
          this.ctx.beginPath();
          this.ctx.moveTo(Math.round(this.ultimoX), Math.round(this.ultimoY));
          this.ctx.lineTo(Math.round(pos.x), Math.round(pos.y));
          this.ctx.stroke();
          break;

        case 'spray':
          const raio = this.tamanho / 2;
          const densidade = Math.max(5, Math.floor(this.tamanho * 2));
          for (let i = 0; i < densidade; i++) {
            const angulo = Math.random() * Math.PI * 2;
            const r = Math.random() * raio;
            const sx = pos.x + Math.cos(angulo) * r;
            const sy = pos.y + Math.sin(angulo) * r;
            this.ctx.fillRect(sx, sy, Math.max(1, this.tamanho / 8), Math.max(1, this.tamanho / 8));
          }
          break;

        case 'borradinho':
          this.ctx.shadowBlur = this.tamanho * 0.8;
          this.ctx.shadowColor = cor;
          this.ctx.lineWidth = this.tamanho;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.beginPath();
          this.ctx.moveTo(this.ultimoX, this.ultimoY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
          break;

        case 'aquarela':
          this.ctx.globalAlpha = this.opacidade * 0.3;
          this.ctx.shadowBlur = this.tamanho * 1.5;
          this.ctx.shadowColor = cor;
          this.ctx.lineWidth = this.tamanho * 1.5;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.beginPath();
          this.ctx.moveTo(this.ultimoX, this.ultimoY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
          break;

        case 'bico_de_pena':
          const distancia = Math.hypot(pos.x - this.ultimoX, pos.y - this.ultimoY);
          const deltaTempo = Math.max(1, pos.tempo - this.ultimoTempo);
          const velocidade = distancia / deltaTempo;
          const larguraDinamica = Math.max(0.5, this.tamanho / (1 + velocidade * 0.4));
          
          this.ctx.lineWidth = larguraDinamica;
          this.ctx.lineCap = 'butt';
          this.ctx.lineJoin = 'miter';
          this.ctx.beginPath();
          this.ctx.moveTo(this.ultimoX, this.ultimoY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
          break;

        case 'normal':
        default:
          this.ctx.lineWidth = this.tamanho;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.beginPath();
          this.ctx.moveTo(this.ultimoX, this.ultimoY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
          break;
      }
    }

    this.ctx.restore();

    this.ultimoX = pos.x;
    this.ultimoY = pos.y;
    this.ultimoTempo = pos.tempo;
  }

  pararDesenho() {
    if (this.desenhando) {
      this.desenhando = false;

      // Se terminou o traço do Pincel Laço, preenche a forma fechada
      if (this.tipo === 'laco' && !this.modoBorracha && this.pontosLaco.length > 2 && this.ctx) {
        this.ctx.save();
        this.ctx.globalAlpha = this.opacidade;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.colorManager ? this.colorManager.corPrimaria : '#ff69b4';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.pontosLaco[0].x, this.pontosLaco[0].y);
        for (let i = 1; i < this.pontosLaco.length; i++) {
          this.ctx.lineTo(this.pontosLaco[i].x, this.pontosLaco[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }

      this.historicoPontos = [];
      this.pontosLaco = [];

      if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
        this.historyManager.salvarEstado();
      }
    }
  }
}

export function inicializarPincel(canvas, historyManager, colorManager) {
  return new PincelTool(canvas, historyManager, colorManager);
}
