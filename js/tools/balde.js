/**
 * PopFlipariz - Ferramenta de Balde de Tinta (Flood Fill Avançado)
 * Caminho: js/tools/balde.js
 */

export class FloodFillTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    // Definições do Balde
    this.opacidade = 1.0;
    this.tolerancia = 32;
    this.expandir = 0.0; // De 0 a 7 (aceita decimais)
    this.amostragem = 'atual'; // 'atual' ou 'todas'
    this.modoBorracha = false;
  }

  setOpacidade(val) { this.opacidade = Math.max(0.01, Math.min(1.0, parseFloat(val) || 1.0)); }
  setTolerancia(val) { this.tolerancia = Math.max(0, Math.min(255, parseInt(val) || 0)); }
  setExpandir(val) { this.expandir = Math.max(0.0, Math.min(7.0, parseFloat(val) || 0.0)); }
  setAmostragem(val) { this.amostragem = val || 'atual'; }
  setModoBorracha(ativo) { this.modoBorracha = !!ativo; }

  hexParaRgba(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, Math.round(this.opacidade * 255)];
  }

  executar(e) {
    const canvasAtivo = this.layerManager.obterCanvasAtivo();
    if (!canvasAtivo) return;

    const rect = canvasAtivo.getBoundingClientRect();
    const xClick = Math.floor((e.clientX - rect.left) * (canvasAtivo.width / rect.width));
    const yClick = Math.floor((e.clientY - rect.top) * (canvasAtivo.height / rect.height));

    if (xClick < 0 || yClick < 0 || xClick >= canvasAtivo.width || yClick >= canvasAtivo.height) return;

    const ctxAtivo = canvasAtivo.getContext('2d', { willReadFrequently: true });
    const largura = canvasAtivo.width;
    const altura = canvasAtivo.height;

    // Obtém dados da imagem alvo com base na amostragem escolhida
    let imgDataAlvo;
    if (this.amostragem === 'todas') {
      // Cria um canvas temporário composto por todas as camadas visíveis
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = largura;
      tempCanvas.height = altura;
      const tempCtx = tempCanvas.getContext('2d');
      
      this.layerManager.camadas.forEach(l => {
        if (l.visivel) {
          tempCtx.globalAlpha = l.opacidade;
          tempCtx.drawImage(l.canvas, 0, 0);
        }
      });
      imgDataAlvo = tempCtx.getImageData(0, 0, largura, altura);
    } else {
      imgDataAlvo = ctxAtivo.getImageData(0, 0, largura, altura);
    }

    const pixels = imgDataAlvo.data;
    const idxClick = (yClick * largura + xClick) * 4;
    const corAlvoR = pixels[idxClick];
    const corAlvoG = pixels[idxClick + 1];
    const corAlvoB = pixels[idxClick + 2];
    const corAlvoA = pixels[idxClick + 3];

    const novaCor = this.modoBorracha ? [0, 0, 0, 0] : this.hexParaRgba(this.colorManager.corPrimaria);

    // Evita loop infinito se clicar numa cor idêntica
    if (
      Math.abs(corAlvoR - novaCor[0]) <= this.tolerancia &&
      Math.abs(corAlvoG - novaCor[1]) <= this.tolerancia &&
      Math.abs(corAlvoB - novaCor[2]) <= this.tolerancia &&
      Math.abs(corAlvoA - novaCor[3]) <= this.tolerancia
    ) {
      return;
    }

    // Algoritmo Flood Fill (Queue-based)
    const visitado = new Uint8Array(largura * altura);
    const fila = [[xClick, yClick]];
    const preenchidos = [];

    while (fila.length > 0) {
      const [x, y] = fila.pop();
      const pos = y * largura + x;

      if (x < 0 || y < 0 || x >= largura || y >= altura) continue;
      if (visitado[pos]) continue;
      visitado[pos] = 1;

      const idx = pos * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (
        Math.abs(r - corAlvoR) <= this.tolerancia &&
        Math.abs(g - corAlvoG) <= this.tolerancia &&
        Math.abs(b - corAlvoB) <= this.tolerancia &&
        Math.abs(a - corAlvoA) <= this.tolerancia
      ) {
        preenchidos.push([x, y]);
        fila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    if (preenchidos.length === 0) return;

    // Aplica o preenchimento no canvas da camada ativa
    const imgCamadaAtiva = ctxAtivo.getImageData(0, 0, largura, altura);
    const pCamada = imgCamadaAtiva.data;

    preenchidos.forEach(([x, y]) => {
      const idx = (y * largura + x) * 4;
      if (this.modoBorracha) {
        pCamada[idx + 3] = 0; // Apaga
      } else {
        pCamada[idx] = novaCor[0];
        pCamada[idx + 1] = novaCor[1];
        pCamada[idx + 2] = novaCor[2];
        pCamada[idx + 3] = novaCor[3];
      }
    });

    // Se houver "Expandir" (> 0), dilata os pixels preenchidos para cobrir o anti-aliasing
    if (this.expandir > 0) {
      const raioExpandir = Math.ceil(this.expandir);
      const novosPreenchidos = new Set();
      
      preenchidos.forEach(([x, y]) => {
        for (let dx = -raioExpandir; dx <= raioExpandir; dx++) {
          for (let dy = -raioExpandir; dy <= raioExpandir; dy++) {
            if (Math.hypot(dx, dy) <= this.expandir) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < largura && ny < altura) {
                const nIdx = (ny * largura + nx) * 4;
                if (this.modoBorracha) {
                  pCamada[nIdx + 3] = 0;
                } else {
                  pCamada[nIdx] = novaCor[0];
                  pCamada[nIdx + 1] = novaCor[1];
                  pCamada[nIdx + 2] = novaCor[2];
                  pCamada[nIdx + 3] = novaCor[3];
                }
              }
            }
          }
        }
      });
    }

    ctxAtivo.putImageData(imgCamadaAtiva, 0, 0);

    if (this.historyManager && typeof this.historyManager.salvarEstado === 'function') {
      this.historyManager.salvarEstado();
    }
  }
}
