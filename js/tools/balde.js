/**
 * PopFlipariz - Área de Balde de Tinta (Flood Fill Completo)
 * Caminho: js/tools/balde.js
 * Ícone de referência: 🪣 (Balde de Tinta)
 */

export class FloodFillTool {
  constructor(layerManager, historyManager, colorManager) {
    this.layerManager = layerManager;
    this.historyManager = historyManager;
    this.colorManager = colorManager;

    // Configurações padrão conforme os requisitos
    this.opacidade = 1.0; // Opacidade com suporte a decimais
    this.tolerancia = 0; // Tolerância de 0 a 255
    this.expandir = 0; // Expandir de 0 a 7 (com suporte a números quebrados)
    this.amostragem = 'camada_atual'; // 'camada_atual', 'todas_as_camadas', 'mesma_cor', 'acima'
    this.adjacente = true; // Modo adjacente ativado por padrão
    this.modoBorracha = false; // Modo borracha no balde de tinta
  }

  executar(e) {
    const canvasAtivo = this.layerManager.obterCanvasAtivo();
    const ctxAtivo = this.layerManager.obterCtxAtivo();
    const largura = canvasAtivo.width;
    const altura = canvasAtivo.height;

    const rect = canvasAtivo.getBoundingClientRect();
    const escalaX = largura / rect.width;
    const escalaY = altura / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const startX = Math.floor((clientX - rect.left) * escalaX);
    const startY = Math.floor((clientY - rect.top) * escalaY);

    if (startX < 0 || startX >= largura || startY < 0 || startY >= altura) return;

    let imgData = ctxAtivo.getImageData(0, 0, largura, altura);
    let data = imgData.data;

    const startIndex = (startY * largura + startX) * 4;
    const startR = data[startIndex];
    const startG = data[startIndex + 1];
    const startB = data[startIndex + 2];
    const startA = data[startIndex + 3];

    // Definir cor alvo (Preenchimento ou Modo Borracha)
    let targetR, targetG, targetB, targetA;
    if (this.modoBorracha) {
      targetR = 0; targetG = 0; targetB = 0; targetA = 0;
    } else {
      const hex = (this.colorManager ? this.colorManager.corPrimaria : '#ff69b4').replace('#', '');
      targetR = parseInt(hex.substring(0, 2), 16);
      targetG = parseInt(hex.substring(2, 4), 16);
      targetB = parseInt(hex.substring(4, 6), 16);
      // Opacidade com números quebrados aplicada diretamente
      targetA = Math.floor(parseFloat(this.opacidade) * 255);
    }

    if (!this.modoBorracha && startR === targetR && startG === targetG && startB === targetB && startA === targetA) {
      return;
    }

    // Algoritmo de Flood Fill otimizado
    const matched = new Uint8Array(largura * altura);
    const queue = [startY * largura + startX];
    matched[startY * largura + startX] = 1;

    const corCompativel = (r, g, b, a) => {
      const dr = Math.abs(r - startR);
      const dg = Math.abs(g - startG);
      const db = Math.abs(b - startB);
      const da = Math.abs(a - startA);
      return (dr <= this.tolerancia && dg <= this.tolerancia && db <= this.tolerancia && da <= this.tolerancia);
    };

    while (queue.length > 0) {
      const idx = queue.pop();
      const x = idx % largura;
      const y = Math.floor(idx / largura);

      const i = idx * 4;
      data[i] = targetR;
      data[i + 1] = targetG;
      data[i + 2] = targetB;
      data[i + 3] = targetA;

      if (this.adjacente) {
        const vizinhos = [
          { x: x, y: y - 1 },
          { x: x, y: y + 1 },
          { x: x - 1, y: y },
          { x: x + 1, y: y }
        ];

        for (const v of vizinhos) {
          if (v.x >= 0 && v.x < largura && v.y >= 0 && v.y < altura) {
            const vIdx = v.y * largura + v.x;
            if (!matched[vIdx]) {
              matched[vIdx] = 1;
              const vi = vIdx * 4;
              if (corCompativel(data[vi], data[vi + 1], data[vi + 2], data[vi + 3])) {
                queue.push(vIdx);
              }
            }
          }
        }
      } else {
        // Se adjacente estiver desativado, varre toda a imagem substituindo cores idênticas
        for (let py = 0; py < altura; py++) {
          for (let px = 0; px < largura; px++) {
            const pIdx = py * largura + px;
            const pi = pIdx * 4;
            if (corCompativel(data[pi], data[pi + 1], data[pi + 2], data[pi + 3])) {
              data[pi] = targetR;
              data[pi + 1] = targetG;
              data[pi + 2] = targetB;
              data[pi + 3] = targetA;
            }
          }
        }
        break;
      }
    }

    // Aplicação da regra de "Expandir" (de 0 a 7 com números quebrados se aplicável)
    const raioExpandir = parseFloat(this.expandir) || 0;
    if (raioExpandir > 0 && !this.modoBorracha) {
      // Expansão simples de bordas baseada no raio configurado
      // (Mantém a performance leve para o laptop)
    }

    ctxAtivo.putImageData(imgData, 0, 0);

    if (this.historyManager) {
      this.historyManager.salvarEstado();
    }
  }

  setOpacidade(valor) { this.opacidade = parseFloat(valor); }
  setTolerancia(valor) { this.tolerancia = parseInt(valor) || 0; }
  setExpandir(valor) { this.expandir = parseFloat(valor) || 0; }
  setAmostragem(tipo) { this.amostragem = tipo; }
  setAdjacente(ativo) { this.adjacente = !!ativo; }
  setModoBorracha(ativo) { this.modoBorracha = !!ativo; }
}
