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
    this.clipboardBuffer = null; // Para Ctrl+C / Ctrl+V de camada

    // Cria a primeira camada padrão ao iniciar
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
    const id = 'layer_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const nome = nomePersonalizado || `Camada ${this.camadas.length + 1}`;
    const canvas = this.criarCanvasElemento();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

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

    if (this.historyManager) this.historyManager.salvarEstado();
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
    if (removida.tipo === 'camada' && removida.canvas) {
      removida.canvas.remove();
    }
    this.indiceCamadaAtiva = Math.max(0, this.indiceCamadaAtiva - 1);
    this.reorganizarDOMCanvas();
    this.atualizarUIlistaCamadas();

    if (this.historyManager) this.historyManager.salvarEstado();
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

    if (this.historyManager) this.historyManager.salvarEstado();
  }

  limparCamadaAtual() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (!atual || atual.tipo !== 'camada') return;
    atual.ctx.clearRect(0, 0, this.largura, this.altura);
    if (this.historyManager) this.historyManager.salvarEstado();
  }

  espelharHorizontal() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (!atual || atual.tipo !== 'camada') return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.largura;
    tempCanvas.height = this.altura;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.translate(this.largura, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(atual.canvas, 0, 0);

    atual.ctx.clearRect(0, 0, this.largura, this.altura);
    atual.ctx.drawImage(tempCanvas, 0, 0);
    if (this.historyManager) this.historyManager.salvarEstado();
  }

  espelharVertical() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (!atual || atual.tipo !== 'camada') return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.largura;
    tempCanvas.height = this.altura;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.translate(0, this.altura);
    tempCtx.scale(1, -1);
    tempCtx.drawImage(atual.canvas, 0, 0);

    atual.ctx.clearRect(0, 0, this.largura, this.altura);
    atual.ctx.drawImage(tempCanvas, 0, 0);
    if (this.historyManager) this.historyManager.salvarEstado();
  }

  copiarCamadaAtual() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (!atual || atual.tipo !== 'camada') return;
    this.clipboardBuffer = atual.ctx.getImageData(0, 0, this.largura, this.altura);
    console.log('Camada copiada para a área de transferência!');
  }

  colarCamada() {
    if (!this.clipboardBuffer) return;
    this.adicionarCamada('Camada Colada');
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (atual && atual.tipo === 'camada') {
      atual.ctx.putImageData(this.clipboardBuffer, 0, 0);
      if (this.historyManager) this.historyManager.salvarEstado();
    }
  }

  definirModoMesclagemAtual(mode) {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (atual && atual.tipo === 'camada') {
      atual.blendMode = mode;
      atual.ctx.globalCompositeOperation = mode;
    }
  }

  toggleAlphaLock() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    if (atual && atual.tipo === 'camada') {
      atual.alphaLocked = !atual.alphaLocked;
      this.atualizarUIlistaCamadas();
    }
  }

  obterCanvasAtivo() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    return (atual && atual.tipo === 'camada') ? atual.canvas : null;
  }

  obterCtxAtivo() {
    const atual = this.camadas[this.indiceCamadaAtiva];
    return (atual && atual.tipo === 'camada') ? atual.ctx : null;
  }

  reorganizarDOMCanvas() {
    this.container.innerHTML = '';
    // Desenha de baixo para cima (ordem das camadas)
    this.camadas.forEach(l => {
      if (l.tipo === 'camada' && l.canvas) {
        l.canvas.style.display = l.visivel ? 'block' : 'none';
        this.container.appendChild(l.canvas);
      }
    });
  }

  atualizarUIlistaCamadas() {
    const lista = document.getElementById('listaCamadas');
    if (!lista) return;
    lista.innerHTML = '';

    this.camadas.forEach((l, idx) => {
      const li = document.createElement('li');
      li.className = `layer-item ${idx === this.indiceCamadaAtiva ? 'active' : ''}`;

      if (l.tipo === 'pasta') {
        li.innerHTML = `
          <span>📁 <strong>${l.nome}</strong></span>
          <button title="Excluir Pasta">🗑️</button>
        `;
        li.querySelector('button').onclick = () => {
          this.camadas.splice(idx, 1);
          this.atualizarUIlistaCamadas();
        };
      } else {
        const lockIcon = l.alphaLocked ? '🔒' : '🔓';
        const visIcon = l.visivel ? '👁️' : '🚫';

        li.innerHTML = `
          <div style="display: flex; align-items: center; gap: 5px; flex: 1; cursor: pointer;">
            <button class="btn-vis" title="Visibilidade">${visIcon}</button>
            <button class="btn-lock" title="Bloqueio Alpha (Lock Alpha)">${lockIcon}</button>
            <span class="layer-name" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.nome}</span>
          </div>
        `;

        // Clicar na camada para ativá-la
        li.onclick = (e) => {
          if (e.target.tagName !== 'BUTTON') {
            this.indiceCamadaAtiva = idx;
            this.atualizarUIlistaCamadas();
          }
        };

        // Duplo clique para renomear
        li.querySelector('.layer-name').ondblclick = () => {
          const novoNome = prompt('Renomear camada:', l.nome);
          if (novoNome) {
            l.nome = novoNome.trim();
            this.atualizarUIlistaCamadas();
          }
        };

        // Botão Visibilidade
        li.querySelector('.btn-vis').onclick = () => {
          l.visivel = !l.visivel;
          this.reorganizarDOMCanvas();
          this.atualizarUIlistaCamadas();
        };

        // Botão Alpha Lock (🔒 / 🔓)
        li.querySelector('.btn-lock').onclick = () => {
          l.alphaLocked = !l.alphaLocked;
          if (l.alphaLocked) {
            l.ctx.globalCompositeOperation = 'source-atop';
          } else {
            l.ctx.globalCompositeOperation = l.blendMode || 'source-over';
          }
          this.atualizarUIlistaCamadas();
        };
      }

      lista.appendChild(li);
    });
  }
}
