/**
 * PopFlipariz - Área de Formas e Vetores Básicos
 * Caminho: js/tools/formas.js
 * Ícone de referência: ⭕ 🔲 🔺 (Círculo, Quadrado e Triângulo sobrepostos)
 */

export class FormasTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    // Configurações e propriedades extraídas dos requisitos
    this.tipoForma = 'circulo'; // 'circulo', 'quadrado', 'linha_reta', 'caminho_retas', 'caminho_curvas'
    this.pontasQuadrado = 4; // Opção de pontas para o quadrado/polígono de 3 a 10
    this.preencher = true;
    this.corPreenchimento = '#ffe4e1';
    this.larguraLinha = 2;
    this.opacidade = 1.0;
    this.modoBorracha = false;

    // Estado de manipulação e pontos para caminhos livres
    this.pontosCaminho = [];
    this.formaAtivaEmEspera = null; 
    this.isTransformando = false;
  }

  // Iniciar o desenho ou criação da forma no canvas
  iniciarForma(x, y) {
    this.pontoInicial = { x, y };
    this.pontosCaminho = [{ x, y }];
    this.isTransformando = true;
  }

  // Atualizar a forma dinamicamente enquanto o utilizador arrasta o rato
  atualizarProgresso(x, y) {
    if (!this.isTransformando) return;
    this.pontoAtual = { x, y };
  }

  // Adicionar ponto extra para caminhos de linhas retas ou curvas editáveis por pontos
  adicionarPontoCaminho(x, y) {
    this.pontosCaminho.push({ x, y });
  }

  // Fixar/Consolidar a forma desenhada no canvas atual (equivalente a carregar no Enter ou no confere)
  fixarFormaNoCanvas() {
    if (!this.isTransformando) return;

    const ctx = this.layerManager.obterCtxAtivo();
    ctx.save();
    ctx.globalAlpha = parseFloat(this.opacidade);

    if (this.modoBorracha) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.colorManager ? this.colorManager.corPrimaria : '#ff69b4';
      ctx.fillStyle = this.corPreenchimento;
    }

    ctx.lineWidth = parseFloat(this.larguraLinha) || 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.tipoForma === 'circulo' && this.pontoInicial && this.pontoAtual) {
      const raio = Math.hypot(this.pontoAtual.x - this.pontoInicial.x, this.pontoAtual.y - this.pontoInicial.y);
      ctx.beginPath();
      ctx.arc(this.pontoInicial.x, this.pontoInicial.y, raio, 0, Math.PI * 2);
      if (this.preencher && !this.modoBorracha) ctx.fill();
      ctx.stroke();

    } else if (this.tipoForma === 'quadrado' && this.pontoInicial && this.pontoAtual) {
      // Suporte a polígonos/formas baseadas em pontas (de 3 a 10 pontas)
      const largura = this.pontoAtual.x - this.pontoInicial.x;
      const altura = this.pontoAtual.y - this.pontoInicial.y;
      
      if (this.pontasQuadrado === 4) {
        ctx.beginPath();
        ctx.rect(this.pontoInicial.x, this.pontoInicial.y, largura, altura);
        if (this.preencher && !this.modoBorracha) ctx.fill();
        ctx.stroke();
      } else {
        // Polígono regular com base no número de pontas selecionado (3 a 10)
        const raioPoly = Math.hypot(largura, altura) / 2;
        const cx = this.pontoInicial.x + largura / 2;
        const cy = this.pontoInicial.y + altura / 2;
        const pontas = Math.min(10, Math.max(3, this.pontasQuadrado));

        ctx.beginPath();
        for (let i = 0; i < pontas; i++) {
          const ang = (i * 2 * Math.PI) / pontas - Math.PI / 2;
          const px = cx + raioPoly * Math.cos(ang);
          const py = cy + raioPoly * Math.sin(ang);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (this.preencher && !this.modoBorracha) ctx.fill();
        ctx.stroke();
      }

    } else if (this.tipoForma === 'linha_reta' && this.pontoInicial && this.pontoAtual) {
      ctx.beginPath();
      ctx.moveTo(this.pontoInicial.x, this.pontoInicial.y);
      ctx.lineTo(this.pontoAtual.x, this.pontoAtual.y);
      ctx.stroke();

    } else if (this.tipoForma === 'caminho_retas' && this.pontosCaminho.length > 1) {
      // Caminho de linha reta com posições de cada ponto ajustáveis
      ctx.beginPath();
      ctx.moveTo(this.pontosCaminho[0].x, this.pontosCaminho[0].y);
      for (let i = 1; i < this.pontosCaminho.length; i++) {
        ctx.lineTo(this.pontosCaminho[i].x, this.pontosCaminho[i].y);
      }
      ctx.stroke();

    } else if (this.tipoForma === 'caminho_curvas' && this.pontosCaminho.length > 1) {
      // Caminho de linha curvada (suave, circular e não pontuda)
      ctx.beginPath();
      ctx.moveTo(this.pontosCaminho[0].x, this.pontosCaminho[0].y);
      for (let i = 1; i < this.pontosCaminho.length - 1; i++) {
        const xc = (this.pontosCaminho[i].x + this.pontosCaminho[i + 1].x) / 2;
        const yc = (this.pontosCaminho[i].y + this.pontosCaminho[i + 1].y) / 2;
        ctx.quadraticCurveTo(this.pontosCaminho[i].x, this.pontosCaminho[i].y, xc, yc);
      }
      ctx.stroke();
    }

    ctx.restore();
    this.isTransformando = false;

    if (this.historyManager) {
      this.historyManager.salvarEstado();
    }
  }

  // Métodos de configuração da ferramenta de formas
  setTipoForma(tipo) { this.tipoForma = tipo; }
  setPontasQuadrado(qtd) { this.pontasQuadrado = parseInt(qtd) || 4; }
  setPreencher(ativo) { this.preencher = !!ativo; }
  setCorPreenchimento(cor) { this.corPreenchimento = cor; }
  setLarguraLinha(largura) { this.larguraLinha = parseFloat(largura) || 1; }
  setOpacidade(op) { this.opacidade = parseFloat(op) || 1.0; }
  setModoBorracha(ativo) { this.modoBorracha = !!ativo; }
}
